# Admin Dashboard - Deployment Guide

## ✅ What's Complete

### Features Implemented:
- ✅ Analytics Dashboard (visitors, revenue, analyses, users)
- ✅ User Management (search, tier editing, PoH verification)
- ✅ Blacklist Control (ban/unban with confirmation)
- ✅ Charts (chain usage, feature usage, tier distribution)
- ✅ Recent Activity Feed (admin actions + payments)
- ✅ Google OAuth Login
- ✅ Admin Email Whitelist (dejitech2@gmail.com)
- ✅ Dark Theme Matching Main App
- ✅ Analytics Tracking Utilities (backend)

### Technical Stack:
- React 18 + TypeScript
- Vite (dev server on port 5174)
- Firebase Auth + Firestore
- Recharts for data visualization
- Lucide React for icons
- date-fns for timestamps

---

## 🚀 Local Development

### Already Running:
```bash
# Admin dashboard is LIVE at:
http://localhost:5174
```

### To Restart Later:
```bash
cd packages/admin
npm run dev
```

**Login:** Use your Google account (dejitech2@gmail.com)

---

## 📦 Build for Production

```bash
cd packages/admin
npm run build
```

This creates a `dist/` folder ready for deployment.

---

## 🌐 Deploy to pxxl

### Option 1: Static Site
1. Build the app:
   ```bash
   npm run build
   ```

2. Upload `packages/admin/dist/` folder to pxxl

3. Configure environment variables on pxxl:
   ```
   VITE_FIREBASE_API_KEY=<from main app>
   VITE_FIREBASE_AUTH_DOMAIN=<from main app>
   VITE_FIREBASE_PROJECT_ID=<from main app>
   VITE_FIREBASE_STORAGE_BUCKET=<from main app>
   VITE_FIREBASE_MESSAGING_SENDER_ID=<from main app>
   VITE_FIREBASE_APP_ID=<from main app>
   ```

4. Deploy to subdomain like: `admin.fundtracer.xyz`

### Option 2: Netlify (if preferred)
```bash
cd packages/admin
npm run build
netlify deploy --prod --dir=dist
```

---

## 🔐 Security Checklist

- [x] Admin email whitelist configured
- [x] Separate deployment from main app
- [ ] Update Firebase Firestore rules (see below)
- [ ] Enable HTTPS only
- [ ] Set up custom domain (admin.fundtracer.xyz)

---

## 🗄️ Firestore Setup

### Required Collections:

The dashboard reads/writes to these collections. They'll be created automatically on first use, but you can pre-create them:

```
users/
  ├── {userId}/
      ├── email: string
      ├── tier: "free" | "pro" | "max"
      ├── pohVerified: boolean
      ├── blacklisted: boolean
      ├── analysisCount: number
      └── lastActive: timestamp

analytics/
  ├── daily_stats/
  │   └── records/
  │       └── {YYYY-MM-DD}/
  │           ├── visitors: number
  │           ├── analysisCount: number
  │           ├── chainUsage: { ethereum, arbitrum, base, linea }
  │           └── featureUsage: { wallet, compare, sybil, contract }
  │
  ├── revenue/
  │   └── payments/
  │       └── {paymentId}/
  │           ├── userId: string
  │           ├── amount: number
  │           ├── txHash: string
  │           └── timestamp: number
  │
  └── user_activity/
      └── logins/
          └── {loginId}/
              ├── userId: string
              └── timestamp: number

admin_actions/
  └── {actionId}/
      ├── action: "tier_change" | "blacklist" | "poh_verify"
      ├── userId: string
      ├── timestamp: number
      └── details: object
```

### Firestore Security Rules:

Add these rules to allow admin write access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Admin actions - only specific admins can write
    match /admin_actions/{actionId} {
      allow read: if request.auth != null && request.auth.token.email == 'dejitech2@gmail.com';
      allow write: if request.auth != null && request.auth.token.email == 'dejitech2@gmail.com';
    }
    
    // Users - admins can edit tier, pohVerified, blacklisted
    match /users/{userId} {
      allow read: if request.auth != null;
      allow update: if request.auth != null && 
                     request.auth.token.email == 'dejitech2@gmail.com';
    }
    
    // Analytics - read only for admins, server writes via admin SDK
    match /analytics/{document=**} {
      allow read: if request.auth != null && request.auth.token.email == 'dejitech2@gmail.com';
      allow write: if false; // Server-side only via Admin SDK
    }
  }
}
```

---

## 📊 Using the Dashboard

### 1. Overview Tab
- View key metrics (visitors, users, revenue, analyses)
- See charts for chain/feature distribution

### 2. Users Tab
- Search users by email/name/wallet
- Click pencil icon to change tier
- Click checkmark to toggle PoH verification
- Click "Ban" to blacklist a user

### 3. Activity Tab
- View recent admin actions
- See payment history
- Track who did what and when

---

## 🧪 Testing Checklist

- [ ] Login with your Google account
- [ ] View stats on Overview tab
- [ ] Search for a user
- [ ] Change a user's tier
- [ ] Toggle PoH verification
- [ ] Blacklist/unban a test user
- [ ] Check Recent Activity shows your actions
- [ ] Verify charts display correctly

---

## 🔄 Adding More Admins

Edit `packages/admin/src/contexts/AuthContext.tsx`:

```typescript
const ADMIN_EMAILS = [
  'dejitech2@gmail.com',
  'another-admin@example.com', // Add more emails here
];
```

Rebuild and redeploy after changes.

---

## 📝 Notes

- **Port:** Admin app runs on 5174 (main app is 5173)
- **Committed:** All code is in GitHub (commit ceecece)
- **Admin Email:** dejitech2@gmail.com is whitelisted
- **Analytics:** Backend tracking is ready but needs integration with analyze endpoints

---

## 🐛 Troubleshooting

**Login fails:** Check Firebase config in `.env`
**Access Denied:** Email not in ADMIN_EMAILS whitelist
**No data showing:** Firestore collections need to exist (create manually or wait for first analysis)
**Charts empty:** Run some analyses in main app first to generate data

---

## ✨ Next Steps

1. Deploy to pxxl at `admin.fundtracer.xyz`
2. Update Firestore security rules
3. Test all features
4. Integrate analytics tracking in main app endpoints (optional enhancement)

**Ready to deploy!** 🚀
