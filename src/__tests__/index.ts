import pluginTester from 'babel-plugin-tester'
import plugin from '..'

function withFileName(code: string) {
  return {
    code,
    babelOptions: {filename: __filename},
  }
}

pluginTester({
  plugin,
  pluginName: 'vite-meta-glob',
  snapshot: true,
  tests: {
    // Positive tests
    'should transform glob without options': withFileName(
      'const modules = import.meta.glob("./fixtures/**/*")',
    ),
    'should transform glob with eager option': withFileName(
      'const modules = import.meta.glob("./fixtures/**/*", { eager: true })',
    ),
    'should transform glob with eager and import option': withFileName(
      'const modules = import.meta.glob("./fixtures/**/*", { eager: true, import: "default" })',
    ),

    // Negative tests
    'should not transform glob with first argument being an array':
      withFileName(
        'const modules = import.meta.glob(["./fixtures/**/*", "./fixtures/specific.js"])',
      ),
    'should not transform glob with eager option being false': withFileName(
      'const modules = import.meta.glob("./fixtures/**/*", { eager: false })',
    ),
    'should not transform other import.meta properties': withFileName(
      'const modules = import.meta.env("./fixtures/**/*")',
    ),
    'should not transform glob with import option without eager': withFileName(
      'const modules = import.meta.glob("./fixtures/**/*", { import: "default" })',
    ),
  },
})
