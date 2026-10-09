import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import skipFormattingConfigs from 'eslint-config-prettier';

export default tseslint.config(
  // 1. Глобальное игнорирование (файлы вне проверки)
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },

  // 2. Базовые рекомендации для JS и TS от команды Vue/TypeScript
  tseslint.configs.js,
  ...tseslint.configs.recommended,

  // 3. Конфигурация для Vue-компонентов (автоматически подключает нужные парсеры)
  ...pluginVue.configs['flat/recommended'],

  // 4. Интеграция TypeScript во Vue-файлы
  {
    files: ['**/*.{ts,mts,tsx,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
  },

  // 5. Окружение Node.js для конфигурационных файлов и тестов vitest
  {
    files: [
      '*.config.ts',
      'vite.config.ts',
      'vitest.config.ts',
      'tests/**/*.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // 6. Логические правила кода (Overrides)
  {
    name: 'app/custom-rules',
    rules: {
      // Проверка неиспользуемых переменных (игнорируя те, что с подчеркиванием)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],

      // Отключение логического правила Vue на обязательные составные имена (опционально)
      'vue/multi-word-component-names': 'off',
    },
  },

  // 7. Отключение конфликтующих правил форматирования (ОБЯЗАТЕЛЬНО в самом конце)
  skipFormattingConfigs,
);
