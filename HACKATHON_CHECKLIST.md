# 🏆 SplitTON Hackathon Checklist

## ✅ Development Status

### **Core Features Complete**
- [x] **Expense Tracking**: Add, edit, delete expenses with participants
- [x] **Balance Calculation**: Real-time debt/credit calculations
- [x] **TON Connect Integration**: Wallet connection with TON Connect 2.0
- [x] **Settlement Suggestions**: Web3 payment suggestions when wallet connected
- [x] **Telegram Web App**: Native TWA integration with haptic feedback
- [x] **Demo Data**: Pre-populated expenses for immediate demo
- [x] **Responsive UI**: Mobile-first design with Tailwind CSS
- [x] **Local Storage**: Hackathon-optimized data persistence

## 🚀 Deployment Steps

### **1. Deploy to Netlify**
```bash
# Build the project
npm run build

# Deploy dist/ folder to Netlify
# OR connect GitHub repo for auto-deployment
```

### **2. Update Manifest URL**
- Update `manifestUrl` in `src/App.tsx` with your deployed domain
- Ensure `public/tonconnect-manifest.json` has correct URLs

### **3. Create Telegram Bot**
```bash
# 1. Message @BotFather on Telegram
# 2. Create new bot: /newbot
# 3. Set menu button: /setmenubutton
# 4. Enter your deployed URL
# 5. Test in Telegram
```

## 🎭 Demo Script (2 Minutes)

### **Opening Hook** (15 seconds)
> *"Everyone has this problem - you go out with friends, someone pays, and then you need to figure out who owes what. Usually you use Venmo or split it later. But what if settling up could onboard people to Web3 naturally?"*

### **Act 1: Web2 Familiar** (30 seconds)
1. Show the normal expense interface
2. Add a new expense: "Dinner at restaurant - $60"
3. Split between 3 people
4. Show how intuitive and familiar it feels
5. **Key message**: *"Looks like any expense app, right?"*

### **Act 2: The Magic Moment** (45 seconds)
1. Click "Settle" tab
2. Show debt calculations: "Alice owes Bob $15"
3. **The reveal**: "Connect TON wallet to settle"
4. Connect wallet (demo the flow)
5. Show settlement suggestions with TON payment buttons
6. **Key message**: *"Now they've discovered TON wallets naturally!"*

### **Act 3: Growth Mechanism** (30 seconds)
1. Show the share button
2. Explain viral growth through Telegram groups
3. Each new user = potential TON adoption
4. **Key message**: *"Perfect Web2→Web3 onboarding with network effects"*

## 🎯 Judging Criteria Alignment

### **TON Integration** ⚡
- ✅ Uses official TON Connect 2.0
- ✅ Wallet connection with user onboarding
- ✅ Settlement suggestions via TON
- ✅ Native to Telegram ecosystem

### **Real Utility** 💪
- ✅ Solves actual problem (expense splitting)
- ✅ Works for travel, dining, group activities
- ✅ Immediate value before crypto introduction
- ✅ Familiar UX that users understand

### **Growth Potential** 📈
- ✅ Viral sharing through Telegram
- ✅ Network effects drive adoption
- ✅ Each user becomes TON wallet potential
- ✅ Organic spread through social groups

### **Technical Excellence** 🛠️
- ✅ Clean, modern React/TypeScript codebase
- ✅ Responsive mobile-first design
- ✅ Proper TON Connect implementation
- ✅ Telegram Web App best practices

## 🗣️ Key Talking Points

### **Problem Statement**
- Expense splitting is universal pain point
- Current solutions don't connect to crypto
- No natural Web3 onboarding exists

### **Solution Innovation**
- Start with familiar Web2 experience
- Introduce Web3 at the right moment (settlement)
- No upfront crypto complexity or education needed

### **Market Opportunity**
- Every friend group splits expenses
- Telegram has 800M+ users
- Perfect distribution channel for TON adoption

### **Competitive Advantage**
- First to combine expense splitting + crypto onboarding
- Native to Telegram/TON ecosystem
- Viral growth mechanics built-in

## ⚡ Quick Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Check build output
ls -la dist/

# Test locally
npx serve dist
```

## 🐛 Quick Fixes

### **If TON Connect doesn't work:**
- Check manifest URL is correct
- Ensure HTTPS deployment
- Verify TON Connect manifest is accessible

### **If Telegram integration fails:**
- Check Telegram Web App script loads
- Verify bot setup with @BotFather
- Test in actual Telegram app, not browser

### **If demo data doesn't load:**
- Check localStorage in browser dev tools
- Clear storage and refresh to regenerate
- Ensure user data flows correctly

## 🏁 Final Pre-Demo Checklist

- [ ] App deployed and accessible via HTTPS
- [ ] TON Connect working with test wallet
- [ ] Telegram bot configured and tested
- [ ] Demo script practiced and timed
- [ ] Backup plan if live demo has issues
- [ ] Screenshots/video prepared as fallback
- [ ] Elevator pitch ready (30 seconds)
- [ ] Technical architecture explanation ready

---

## 💡 Judge Questions & Answers

**Q: How is this different from Splitwise?**
A: Splitwise is Web2 only. We introduce Web3 naturally when users need to settle, onboarding them to TON ecosystem.

**Q: Why TON specifically?**
A: Native to Telegram, fast/cheap transactions, perfect for peer-to-peer payments, and has 900M+ potential users.

**Q: What's the business model?**
A: Transaction fees on TON settlements, premium features, partnerships with TON ecosystem projects.

**Q: How do you handle users without crypto experience?**
A: They use it as normal expense tracker first. Only when they want to settle do they discover wallets - with guidance.

**Q: What's the growth strategy?**
A: Viral sharing through Telegram groups, referral incentives, integration with travel/social apps.

---

**🎯 Remember: This isn't just an expense app - it's a Web3 onboarding tool disguised as something everyone needs!** 