# Product Requirements Document (PRD) - Buku Saku OB

## 1. Project Overview
**Buku Saku OB** is a mobile-first, offline-ready web application designed to help office boys (OBs) manage daily employee requests (canteen orders), track cash bailouts (talangan), manage active deposit balances, reconcile office shopping lists, and record their attendance logs. The system is designed to be highly intuitive, minimalist, and professional.

---

## 2. Target Audience & Personas
- **Primary User:** Office Boys (OB) who handle purchase orders for employees, go shopping for office stocks, and log their daily working hours.
- **Secondary User (Staf/Karyawan):** Office staff who place orders, top up deposit balances, and pay off bailout debts.

---

## 3. Core Features & Functional Requirements

### 3.1 Onboarding & Verification Flow
- **Splash Screen:** Visual welcome page with animated loading bar. Automatically checks for active local user sessions to redirect logged-in users directly to the dashboard.
- **Landing Page:** Minimalist welcome screen outlining primary value propositions with buttons for Login and Registration.
- **Login Screen:** Input fields for WhatsApp Phone Number and 6-digit PIN.
- **Register Screen:** Input fields for Full Name, WhatsApp Phone Number, and a new 6-digit PIN. Registers the user both as an app operator and adds them to the employee list for internal bookkeeping.
- **OTP Verification Screen:** Triggers immediately after login or registration if the WhatsApp number is not verified. Demands a 4-digit code (simulated code: `1234`) with explicit instructions.

### 3.2 Canteen Order Management (Daftar Pesanan)
- **Order Creation:** Supports registering new orders selecting an employee from the database, specifying the food/drink item, and declaring either "Talangan OB" (default) or "Uang Titipan" (cash paid upfront).
- **Cash Handled Logic:** If the employee has active deposit funds, the "Uang Titipan" input is disabled to prioritize deposit-aware ordering.
- **Purchase Finalization (Beli):** Allows the OB to input the actual canteen price (harga asli) to finalize an order.
- **Reconciliation & Change:** If there is change due ("Uang Titipan" > "Harga Asli"), the order switches to *Menunggu Kembalian* until the OB confirms that the change has been returned.
- **Filter Tabs:** View orders split into *Belum Dibeli* (Active) and *Selesai* (Reconciled).

### 3.3 Ledger & Financial Management (Buku Kas)
- **Employee Directory:** Lists all registered employees, displaying individual **Hutang** (bailout debts) and **Deposit** balances side-by-side, along with a computed **Kekurangan Bersih** (net shortage).
- **Personal Ledger Sheet:** Detail page for each employee showing complete history logs of orders and top-up transactions with *Lunas* vs *Belum Lunas* indicators.
- **Independent Balance Model:** Deposits and debts are kept completely separate (not automatically netted during canteen purchase completion) to preserve transaction transparency.
- **Manual Netting ("Potong Deposit"):** If an employee has both deposit funds and outstanding debt, a dedicated option is presented in the "Bayar / Top Up" section to manually apply the deposit balance to pay off the debt.
- **Top Up / Cash Settlement:** Process cash payments to reduce debt or top up deposits.
- **WhatsApp Billing Integration:** Generates WhatsApp messaging templates for payment reminders:
  - Excludes the employee's name and general greetings for privacy and directness.
  - Lists individual items formatting dates, descriptions, and prices directly (e.g. `[14 Jun] Beli: Kopi Hitam Double Shot Rp8.000`).
  - Displays the total debt, current deposit, and calculated **Sisa Kekurangan** (shortage after deposit deduction).

### 3.4 Office Shopping Calculator (Kalkulator Belanja)
- **Trolley Manager:** Add shopping list items specifying name, unit price (formatted automatically with thousand separators), and quantity.
- **Historical Autocomplete & Price Autofill:** Suggests previously bought items from past shopping logs via dropdown. Automatically populates the unit price based on the last recorded purchase value of that item.
- **Budget Reconciler:** Visual progress bar tracking total trolley cost against the defined budget limit (editable limit).
- **Shopping History:** Saves completed shopping lists into a dedicated *Riwayat Belanja* tab for accounting.

### 3.5 Personal Attendance Log (Absensi Mandiri)
- **Check-in/out:** Simulated biometric fingerprint checkout.
- **Monthly Logs:** Shows daily check-in and check-out times. Time durations (total working hours/minutes metrics) are hidden to simplify reporting.
- **Date Range Filters:** Allows filtering log data by month.

---

## 4. Technical Architecture & Data Storage

### 4.1 Technology Stack & PWA
- **Frontend:** Vite + Svelte (PWA configuration).
- **Styling:** Tailwind CSS + Svelte Transitions (60 FPS local transitions).
- **Database Local / Offline Cache:** Dexie.js (IndexedDB wrapper) for offline-first operations.
- **Backend / Realtime Database:** Supabase (PostgreSQL + Realtime).
- **OTP WA Handler (Method A):** Supabase Edge Functions connected to Custom Node.js WA Gateway (bypass simulated for local development).

### 4.2 OTP WhatsApp Verification Flow (Method A)
For production, verification follows the Edge Function trigger:
1. User requests OTP -> Frontend calls Supabase Edge Function `send-otp`.
2. Edge Function generates a 4-digit code, stores it in `otp_codes` table with a 5-minute expiration, and fires a POST request to the self-hosted Custom WA Gateway.
3. **Current Dev State (Bypassed):** For development, the database verification is bypassed. Entering the simulated code `1234` immediately marks the user's phone number as verified in the local state.

### 4.3 Data Models (Database Schemas)

#### OTP Verification Schema (`otp_codes`)
```typescript
interface OtpCode {
  id: string;         // Unique transaction ID
  phone: string;      // Target WhatsApp phone number
  code: string;       // Generated 4-digit OTP code (e.g. '5923')
  created_at: string; // ISO timestamp of creation
  expires_at: string; // ISO timestamp of expiration (created_at + 5 minutes)
  verified: boolean;  // Verification status flag
}
```

#### Employee Schema (`employees`)
```typescript
interface Employee {
  id: string;      // Unique employee ID ('emp-XXXXXX')
  nama: string;    // Word-capitalized full name
  telepon: string; // WhatsApp number
  deposit: number; // Active prepaid balance (Rp)
  hutang: number;  // Unpaid bailout balance (Rp)
}
```

#### Order Schema (`orders`)
```typescript
interface Order {
  id: string;
  karyawanId: string;
  barang: string;       // Sentence-capitalized item name
  titipan: number;      // Cash upfront (0 for talangan)
  realHarga: number;    // Final price after canteen purchase
  kembalian: number;    // Change due to employee
  status: 'BELUM_DIBELI' | 'MENUNGGU_KEMBALIAN' | 'SELESAI';
  tanggal: string;      // ISO timestamp
}
```

#### Ledger Transaction Schema (`ledger`)
```typescript
interface LedgerItem {
  id: string;
  karyawanId: string;
  tipe: 'PESANAN' | 'TOPUP';
  nominal: number;      // Negative for purchases/debts, positive for payments
  keterangan: string;   // Transaction description
  lunas: boolean;       // FIFO payment matching flag
  tanggal: string;      // ISO timestamp
}
```

---

## 5. UI/UX Design System & Theme
- **Theme Concept:** Minimalist Professional. Matches clean SaaS dashboards (e.g., Stripe, Slack, Notion).
- **Header Style:** Clean solid white background, minimal indigo accents, clear slate text, and thin grey bottom border divider.
- **Status Bar:** Matching white background with neutral slate text.
- **Modal dialogs:** Smooth custom overlay modals (`showCustomConfirm`) utilizing backdrop blurs (`backdrop-blur-sm`) and scale transitions instead of native browser popups.
