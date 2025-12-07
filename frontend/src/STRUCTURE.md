# Frontend Source Structure

This document describes the folder structure for the Sumber Jaya App frontend.

## 📁 Folder Organization

```
frontend/src/
├── App.js                 # Main application component (to be refactored)
├── index.js              # Application entry point
├── index.css             # Global styles
├── STRUCTURE.md          # This file
│
├── components/           # Reusable UI components
│   ├── common/          # Common components (Header, Sidebar, Footer, etc)
│   ├── modals/          # Modal dialog components
│   └── forms/           # Form components
│
├── pages/               # Page components (main views)
│   ├── Beranda/        # Dashboard/Home page
│   ├── KasKecil/       # Cash management (Kas Kecil) page
│   ├── ArusKas/        # Cash flow (Arus Kas) page
│   ├── DetailKas/      # Cash details page
│   ├── Penjualan/      # Sales page
│   ├── Laporan/        # Reports page
│   ├── MasterKategori/ # Category master data page
│   └── MasterAdmin/    # Admin master data page
│
├── hooks/              # Custom React hooks
│   └── .gitkeep
│
├── utils/              # Helper functions and utilities
│   └── .gitkeep
│
└── services/           # API service layer (already exists)
    └── api.js          # API endpoints and authentication
```

## 📋 Purpose of Each Folder

### `components/`
Contains reusable UI components that can be used across multiple pages.

- **`common/`**: Shared components like Header, Sidebar, Navigation, Loading indicators, etc.
- **`modals/`**: Modal dialogs like Add/Edit forms, Confirmation dialogs, etc.
- **`forms/`**: Form components and form-related utilities

### `pages/`
Contains page-level components. Each folder represents a main view/route in the application.

- **`Beranda/`**: Dashboard with statistics and quick access
- **`KasKecil/`**: Cash management interface
- **`ArusKas/`**: Comprehensive cash flow view
- **`DetailKas/`**: Detailed cash transaction view
- **`Penjualan/`**: Sales entry and management
- **`Laporan/`**: Reports and PDF exports
- **`MasterKategori/`**: Category master data management
- **`MasterAdmin/`**: User and admin management

### `hooks/`
Custom React hooks for shared logic:
- Authentication hooks
- Data fetching hooks
- Form management hooks
- State management hooks

### `utils/`
Helper functions and utilities:
- Date formatting functions
- Currency formatting
- Validation helpers
- Constants and configurations

### `services/`
API integration layer (already implemented):
- API endpoint definitions
- HTTP request handlers
- Authentication service
- Data fetching services

## 🎯 Migration Strategy

This folder structure is part of **Phase 1** of refactoring the large `App.js` file (6,426 lines).

### Current State (Phase 1 - COMPLETE ✅)
- ✅ Folder structure created
- ✅ `.gitkeep` files added to track empty folders
- ⚠️ `App.js` remains unchanged (will be split in future phases)

### Future Phases
- **Phase 2**: Extract utility functions to `utils/`
- **Phase 3**: Create custom hooks in `hooks/`
- **Phase 4**: Extract common components to `components/`
- **Phase 5**: Split pages into separate components in `pages/`
- **Phase 6**: Refactor `App.js` to use the new structure

## 📝 Notes

- All folders contain `.gitkeep` files to ensure Git tracks empty directories
- The `services/` folder already exists and contains `api.js`
- `App.js` currently contains ~6,426 lines of code with 67+ hooks
- This structure follows React best practices for scalable applications
- Future refactoring will be done incrementally to avoid breaking changes

## 🔗 Related Files

- **Main App**: `App.js` (to be refactored)
- **API Services**: `services/api.js`
- **Entry Point**: `index.js`
- **Styles**: `index.css`

---

**Created**: December 7, 2025  
**Purpose**: Phase 1 - Setup folder structure for App.js separation  
**Status**: Structure Ready, Refactoring Pending
