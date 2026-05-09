# TODO: GikpsMail Enhancements

## 🚀 Real-time Updates (Socket.io)
- [ ] Install `socket.io` in `backend`
- [ ] Integrate `socket.io` in `backend/src/index.js`
- [ ] Emit `new-email` event in `backend/src/controllers/emailController.js` after successful `sendEmail`
- [ ] Install `socket.io-client` in `frontend`
- [ ] Setup Socket.io connection in `frontend/src/pages/Dashboard.jsx`
- [ ] Update `Dashboard.jsx` to listen for `new-email` and update the UI

## 🎨 UI/UX Overhaul (Responsive & Branded)
- [ ] Define new color palette based on logo:
  - Primary: `#082139` (Navy)
  - Secondary: `#9999CC` (Light Blue)
  - Background: `#F8F9FA`
  - Surface: `#FFFFFF`
- [ ] Implement responsive layout in `frontend/src/pages/Dashboard.css`:
  - Use media queries for mobile/tablet
  - Hamburger menu for sidebar on mobile
  - Responsive email list and detail view
- [ ] Refine component styling for a "premium" feel:
  - Better shadows and border-radius
  - Smooth transitions and animations
  - Improved typography

## 🐛 Bug Fixes & Improvements
- [ ] Investigate and fix the recipient limitation (allow sending to external emails if possible)
- [ ] Improve error handling in both frontend and backend
- [ ] Implement "Compose Email" functionality (currently just a button)
- [ ] Add search functionality for emails
- [ ] Refine "Delete" and "Star" interactions (avoid `window.confirm` if possible)
