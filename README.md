# OrderFlow — Job Jacket System

Modern production management system for engraving companies. Built with Vite, TypeScript, and Supabase.

## 🚀 Quick Start for a New PC

If you just cloned this repository to a new computer, follow these steps:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Since `.env` is ignored by Git, you must create it manually in the root folder:
   - Create a file named `.env`
   - Paste your Supabase credentials (get them from your existing PC or Supabase Dashboard):
     ```env
     VITE_SUPABASE_URL=your_project_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```

3. **Run the App**
   ```bash
   npm run dev
   ```

---

## 🌐 Local Network Access

To make the app available to other devices in your local network (e.g., tablets on the production floor):

1. **Run with Host Flag**
   Instead of just `npm run dev`, use:
   ```bash
   npx vite --host
   ```

2. **Access via IP**
   Vite will display a Network URL (e.g., `http://192.168.1.15:5173/`).
   Open this URL on any device connected to the same Wi-Fi/LAN.

---

## 📎 File Handling
- **Upload**: All file types are accepted when attaching files to order variants (logos, PDFs, vectors, etc.)
- **Storage**: Files are uploaded to **Supabase Storage** (`order-attachments` bucket). Legacy base64 data is still supported for backward compatibility.
- **Download**: Files are force-downloaded as attachments via blob fetch, ensuring cross-origin Supabase URLs work correctly.

---

## 🔴 Realtime (Live Updates)

OrderFlow uses **Supabase Realtime** to sync changes across multiple PCs instantly — no page refresh needed.

**Setup** (one-time): In your Supabase Dashboard → **Database → Replication**, enable replication for:
- `orders`
- `order_variants`
- `order_logs`
- `stages`

Changes made on one PC (creating orders, toggling variants, moving stages) will automatically appear on all other connected devices.

---

## 🛠 Tech Stack
- **Frontend**: Vite + TypeScript + Vanilla CSS
- **Database**: Supabase (Postgres)
- **Storage**: Supabase Storage (file attachments)
- **Deployment**: Local network exposure + GitHub Backup
