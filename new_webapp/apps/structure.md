# Project Structure Proposal

To reshape the codebase into a clean, engineering-grade monorepo structure as requested, follow this directory layout when moving to a production environment (outside of this web container):

```
/
├── apps/
│   ├── desktop/          # Tauri Rust Core
│   │   ├── src-tauri/
│   │   └── package.json
│   │
│   ├── frontend/         # React + Vite Web App
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── views/
│   │   │   ├── services/
│   │   │   └── types.ts
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── backend/          # Python/FastAPI (Optional if local Python needed)
│       ├── main.py
│       └── requirements.txt
│
├── packages/             # Shared Types/Utils
│   └── shared-types/
│
├── turbo.json           # Turborepo config (optional)
└── package.json         # Workspace root
```

## Implementation Notes
1. **Frontend**: The current React code belongs in `apps/frontend`.
2. **Desktop**: The `apps/desktop` would wrap the frontend using Tauri.
3. **Security**: Ensure API keys are kept in memory in the Frontend (as implemented) and never written to disk by the Desktop backend unless explicitly encrypted in the OS Keychain.
