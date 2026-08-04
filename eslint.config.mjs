import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local Supabase CLI artifacts (not app source)
    "supabase/.temp/**",
    "supabase/.branches/**",
  ]),
  {
    // Client pages fetch on mount via useEffect → setState; allowed for MVP
    // data loading until a shared Suspense/data library is adopted.
    files: ["app/**/page.tsx", "components/**/*.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
