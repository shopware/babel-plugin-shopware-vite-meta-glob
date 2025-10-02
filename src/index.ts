import nodePath from 'path'
import {globSync} from 'glob'
import type babelCore from '@babel/core'
import debug from 'debug'

const bugger = debug('babel-plugin-shopware-vite-meta-glob')

export default function viteMetaGlobBabelPlugin({
  types: t,
}: typeof babelCore): babelCore.PluginObj {
  const asts = {
    glob: (path: string) =>
      t.arrowFunctionExpression(
        [],
        t.callExpression(t.identifier('import'), [t.stringLiteral(path)]),
      ),
  }

  const isGlobKey = (propertyName: unknown) => propertyName === 'glob'

  // Helper function to extract patterns from first argument
  const extractPatterns = (firstArg: any, cwd: string): string[] => {
    if (t.isStringLiteral(firstArg)) {
      // Handle single string pattern: "./fixtures/**/*"
      return globSync(firstArg.value, {cwd, dotRelative: true})
        .sort()
        .map(globPath => globPath.replace(/\\/g, '/'))
    } else if (t.isArrayExpression(firstArg)) {
      // Handle array of string patterns: ["./path1.js", "./path2.js"]
      const allGlobPaths: string[] = []
      for (const element of firstArg.elements) {
        if (t.isStringLiteral(element)) {
          const paths = globSync(element.value, {cwd, dotRelative: true}).map(
            globPath => globPath.replace(/\\/g, '/'),
          )
          allGlobPaths.push(...paths)
        }
      }
      return allGlobPaths.sort()
    }
    return []
  }

  return {
    name: 'shopware-vite-meta-glob',
    visitor: {
      CallExpression(path, state) {
        const memberExpression =
          t.isMemberExpression(path.node.callee) && path.node.callee

        if (!memberExpression) {
          return
        }

        const args = path.node.arguments
        const sourceFile = state.file.opts.filename
        const propertyName =
          t.isIdentifier(memberExpression.property) &&
          memberExpression.property.name

        if (
          !sourceFile ||
          !isGlobKey(propertyName) ||
          !t.isMetaProperty(memberExpression.object)
        ) {
          return
        }

        // Check if first argument is either a string literal or array expression
        if (!t.isStringLiteral(args[0]) && !t.isArrayExpression(args[0])) {
          console.warn(
            `Did not transform ${sourceFile} because the first argument is not a string pattern or array of patterns`,
          )

          return
        }

        /**
         * Transform this:
         * const modules = import.meta.glob('./dir/*.js')
         * or
         * const modules = import.meta.glob(['./dir/file1.js', './dir/file2.js'])
         *
         * into this:
         * const modules = {
         *  './dir/file1.js': import('./dir/file1.js'),
         * './dir/file2.js': import('./dir/file2.js'),
         * }
         */
        if (args.length === 1) {
          bugger('Processing:', sourceFile)
          const cwd = nodePath.dirname(sourceFile)
          bugger(`Using directory "${cwd}" to resolve globs`)
          const globPaths = extractPatterns(args[0], cwd)

          bugger('Glob paths: ', globPaths)

          const replacement = t.objectExpression(
            globPaths.map(globPath =>
              t.objectProperty(t.stringLiteral(globPath), asts.glob(globPath)),
            ),
          )

          path.replaceWith(replacement)
        }

        /**
         * Transform this:
         * const modules = import.meta.glob('./dir/*.js', { eager: true })
         * or
         * const modules = import.meta.glob(['./dir/file1.js', './dir/file2.js'], { eager: true })
         *
         * Into this:
         * import * as __glob__0_0 from './dir/foo.js'
         * import * as __glob__0_1 from './dir/bar.js'
         * const modules = {
         *   './dir/foo.js': __glob__0_0,
         *   './dir/bar.js': __glob__0_1,
         * };
         */
        if (args.length === 2) {
          const eagerOption =
            t.isObjectExpression(args[1]) &&
            args[1].properties.filter(
              p =>
                t.isObjectProperty(p) &&
                t.isIdentifier(p.key) &&
                p.key.name === 'eager',
            )
          const importOption =
            t.isObjectExpression(args[1]) &&
            args[1].properties.filter(
              p =>
                t.isObjectProperty(p) &&
                t.isIdentifier(p.key) &&
                p.key.name === 'import',
            )
          const useImportOption =
            !!importOption &&
            importOption.length > 0 &&
            t.isObjectProperty(importOption[0]) &&
            t.isStringLiteral(importOption[0].value)

          if (
            !eagerOption ||
            eagerOption.length === 0 ||
            !t.isObjectProperty(eagerOption[0]) ||
            !t.isBooleanLiteral(eagerOption[0].value)
          ) {
            console.warn('Did not transform because eager option is not set')
            return
          }

          const cwd = nodePath.dirname(sourceFile)
          const globPaths = extractPatterns(args[0], cwd)

          // eager: true
          if (eagerOption[0].value.value) {
            const identifiers = globPaths.map((_, idx) =>
              t.identifier(`__glob__0_${idx}`),
            )

            const imports = globPaths.map((globPath, idx) => {
              let modulePath = t.stringLiteral(globPath)

              if (useImportOption) {
                return t.variableDeclaration('const', [
                  t.variableDeclarator(
                    identifiers[idx],
                    t.memberExpression(
                      t.callExpression(t.identifier('require'), [modulePath]),
                      // @ts-ignore - We know it's a string literal
                      t.identifier(importOption[0].value.value),
                    ),
                  ),
                ])
              }

              return t.variableDeclaration('const', [
                t.variableDeclarator(
                  identifiers[idx],
                  t.callExpression(t.identifier('require'), [modulePath]),
                ),
              ])
            })

            const variable = t.variableDeclaration('const', [
              t.variableDeclarator(
                t.identifier('__glob__context__'),
                t.objectExpression(
                  globPaths.map((globPath, idx) =>
                    t.objectProperty(
                      t.stringLiteral(globPath),
                      identifiers[idx],
                    ),
                  ),
                ),
              ),
            ])

            const returnStatement = t.returnStatement(
              t.identifier('__glob__context__'),
            )

            path.replaceWithMultiple([...imports, variable, returnStatement])
          }
        }

        bugger('Replacement', path.toString())
      },
    },
  }
}
