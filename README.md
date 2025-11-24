<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Elfangary Honey Dashboard

A modern React dashboard for managing orders and menu items for an e-commerce honey business, with real-time order tracking and inventory management.

## Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL database or Supabase account
- Gemini API key (optional, for AI features)

### Run Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env.local`
   - Add your `GEMINI_API_KEY` and `DATABASE_URL`

3. **Start the development server:**
   ```bash
   npm run dev:all
   ```
   - Dashboard: http://localhost:3000
   - Backend API: http://localhost:3001

## Deploy to Netlify

Ready to go live? See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for step-by-step instructions.

**Quick deploy:**
1. Push code to GitHub
2. Connect repo to Netlify
3. Add `DATABASE_URL` environment variable
4. Done! ✅

See [NETLIFY_CHECKLIST.md](./NETLIFY_CHECKLIST.md) for a quick checklist.

## Features

- 📦 **Order Management** - Create, track, and update orders in real-time
- 🍯 **Menu Management** - Add, edit, and toggle menu items
- 📊 **Dashboard Stats** - View order counts and totals
- 🔍 **Search & Filter** - Find orders by customer or status
- 📱 **Responsive Design** - Works on desktop and mobile
- 🗄️ **PostgreSQL Backend** - Persistent data storage

## Project Structure

```
├── components/           # React components
├── services/            # API services
├── types.ts             # TypeScript definitions
├── App.tsx              # Main app component
├── netlify/
│   └── functions/       # Serverless API functions
├── schema.sql           # Database schema
└── netlify.toml         # Netlify configuration
```

## Available Scripts

- `npm run dev` - Start Vite dev server
- `npm run server` - Start Express backend
- `npm run dev:all` - Run both dev server and backend
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Database

Uses PostgreSQL with the following main tables:
- `orders` - Order records
- `order_items` - Items in each order
- `items` - Menu items
- `clients` - Customer information

Setup: Import `schema.sql` into your database.

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@host/database
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
```

## Deployment

Currently configured for Netlify with serverless functions. See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md).
