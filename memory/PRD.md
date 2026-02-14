# GameShop Nepal - Product Requirements Document

## Original Problem Statement
Clone of the GitHub repository `https://github.com/Sushant-Poudel/GANGULI-Wata` - a full-stack e-commerce application (GameShop Nepal) built with React, FastAPI, and MongoDB.

## User Personas
1. **Customers**: Browse products, make purchases, earn/use credits
2. **Admins**: Manage products, orders, customers, and promotional features

## Core Features

### Implemented Features ✅

#### 1. Daily Login Reward System (Completed: Feb 14, 2026)
- Users can claim daily credits
- Reward amount configurable by admin
- Daily reset at 12:00 AM Nepal Time (Asia/Kathmandu)
- Streak tracking with milestone bonuses
- Admin panel at `/admin/daily-reward`

#### 2. Credit Deduction Bug Fix (Completed: Feb 14, 2026)
- Fixed issue where store credits weren't deducted after order confirmation
- Properly handles `customer_email` and `credits_pending` flag

#### 3. Partial Credit Usage (Completed: Feb 14, 2026)
- Users can input specific amount of credit to use at checkout
- Works on both CheckoutPage and ProductPage order dialogs

#### 4. Navbar UI Update (Completed: Feb 14, 2026)
- Removed "Blog" link from navigation
- Reordered links: Home, Daily Rewards, About
- Improved spacing

#### 5. Referral Program (Completed: Feb 14, 2026)
- Each customer gets unique referral code
- Referrer earns credits when friend signs up (default: Rs 50)
- New user earns credits when using code (default: Rs 25)
- Optional: require first purchase before referrer gets reward
- Admin panel at `/admin/referral`
- User can apply referral code on Daily Rewards page

#### 6. Points Multiplier Events (Completed: Feb 14, 2026)
- Admin can create time-limited multiplier events
- Multipliers apply to: daily rewards, cashback, referrals
- Active multiplier shown on Daily Rewards page
- Admin panel at `/admin/multiplier`

## Technical Architecture

### Frontend
- React with React Router
- Tailwind CSS + shadcn/ui components
- Axios for API calls

### Backend
- FastAPI (Python)
- Motor (async MongoDB driver)
- JWT authentication

### Database
- MongoDB

### Key Collections
- `customers` - user accounts with credit_balance, referral_code
- `orders` - purchase records
- `products` - product catalog
- `daily_reward_settings` - reward configuration
- `daily_reward_claims` - claim tracking
- `referral_settings` - referral program config
- `referrals` - referral records
- `multiplier_events` - promotional events

## API Endpoints

### Daily Rewards
- `GET /api/daily-reward/settings` - Get settings (public)
- `PUT /api/daily-reward/settings` - Update settings (admin)
- `GET /api/daily-reward/status` - Check user's claim status
- `POST /api/daily-reward/claim` - Claim daily reward

### Referral Program
- `GET /api/referral/settings` - Get settings (public)
- `PUT /api/referral/settings` - Update settings (admin)
- `GET /api/referral/code/{email}` - Get user's referral code
- `POST /api/referral/apply` - Apply referral code
- `GET /api/referrals/all` - Get all referrals (admin)

### Multiplier Events
- `GET /api/multiplier/active` - Get active multiplier (public)
- `GET /api/multiplier/events` - List all events (admin)
- `POST /api/multiplier/events` - Create event (admin)
- `PUT /api/multiplier/events/{id}` - Update event (admin)
- `DELETE /api/multiplier/events/{id}` - Delete event (admin)

## Files Modified/Created

### Backend
- `/app/backend/server.py` - All API endpoints and business logic

### Frontend
- `/app/frontend/src/App.js` - Routes
- `/app/frontend/src/components/Navbar.jsx` - Navigation
- `/app/frontend/src/components/AdminLayout.jsx` - Admin sidebar
- `/app/frontend/src/pages/DailyRewardPage.jsx` - Daily rewards + referral UI
- `/app/frontend/src/pages/CheckoutPage.jsx` - Partial credit usage
- `/app/frontend/src/pages/ProductPage.jsx` - Partial credit usage
- `/app/frontend/src/pages/admin/AdminDailyReward.jsx` - Admin daily rewards
- `/app/frontend/src/pages/admin/AdminReferral.jsx` - Admin referral settings
- `/app/frontend/src/pages/admin/AdminMultiplier.jsx` - Admin multiplier events

## Backlog / Future Features

### Engagement
- [ ] Spin the Wheel
- [ ] Achievement Badges

### Shopping Experience
- [ ] Product Filters
- [ ] Sort Options
- [ ] Recently Viewed
- [ ] Quick View

### Customer Features
- [ ] Order History Page
- [ ] Saved Payment Methods
- [ ] Live Chat

### Admin Improvements
- [ ] Sales Dashboard
- [ ] Low Stock Alerts
- [ ] Customer Analytics

## Known Technical Debt
- `server.py` is 3900+ lines - should be split into modules for maintainability

## Admin Credentials
- Username: `gsnadmin`
- Password: `gsnadmin`
