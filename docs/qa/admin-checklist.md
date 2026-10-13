# Admin — manual checklist

Automated tests check that signed-out visitors never reach `/admin`, and unit tests cover the
admin rules (status flow, filters, forms, CSV). These steps need a real owner account, so they
are checked by hand on the live site (https://mago-rose.vercel.app/admin) or locally
(`npm run dev`, http://localhost:3000/admin).

Before you start: sign up on the website with the owner's email, then promote it once in the
Supabase SQL editor (see **Promote the first owner** in the README).

## 1. Getting in
- [ ] Open **/admin** while signed out: you are sent to **MAGO admin** sign-in, and after signing
      in you land back on **/admin**.
- [ ] Sign in with a customer account (not staff): the sign-in page says the account does not
      have admin access.
- [ ] The sidebar (or the ☰ menu on a phone) lists Home, Orders, Products, Collections,
      Inventory, Customers, Discounts, Analytics and Settings. **View store** opens the shop.
- [ ] The sign-out icon (top right) signs you out and returns to the admin sign-in.

## 2. Home and Analytics
- [ ] **Home** shows total sales, orders, average order and new customers for the last 30 days,
      with the change against the 30 days before. Switch to **Last 7 days** and **Year to date**.
- [ ] Recent orders, top products and low stock match what you expect.
- [ ] **Analytics → Export orders** downloads a CSV that opens in Excel or Google Sheets
      (Arabic names readable).

## 3. Orders
- [ ] Place a test order on the website (cash on delivery). It appears at the top of **Orders**
      as *Pending* / *Unpaid* / *Website*.
- [ ] Search by order number, phone and name; filter by status and dates; **Clear** resets.
- [ ] Open the order: items (Mix Boxes show their cups), totals, customer, address and timeline.
- [ ] **Mark confirmed**, then **Out for delivery** with a note ("Driver: …"): each step adds a
      line to the timeline with your name. There is no button to go backwards.
- [ ] **Mark as paid** → the badge turns *Paid*.
- [ ] **Packing slip** opens a printable page; **Print** prints only the slip.
- [ ] On another test order, **Cancel order**: you are asked first; afterwards the cups are back
      in stock (check Inventory) and there are no more status buttons.
- [ ] **New order**: add two products, fill in the customer, place it. It opens as an *Admin*
      order; stock went down. Try a sold-out product: its **+** is disabled.

## 4. Products and collections
- [ ] **Products → Add product**: create a draft cup. It does not show in the shop.
- [ ] On the product page, drop a JPEG photo: it appears with **Main** on the first photo.
      Try a PDF or a 10 MB photo: refused with a message, nothing uploaded.
- [ ] Change alt text and kind, move photos up/down, remove one.
- [ ] Set **Visibility** to *Active* and save: the product shows in the shop at once
      (refresh the shop page). Edit the price: the shop shows the new price.
- [ ] **Duplicate** opens a draft copy. **Archive** removes a product from the shop.
- [ ] **Collections**: add products to a collection; the shop filter for it lists them.

## 5. Inventory
- [ ] **Add 24 · Restock · "Weekly delivery"** on a cup: the stock goes up and the change is
      listed under *Recent stock changes* with your name.
- [ ] **Remove** more units than are in stock: refused (unless "Sell when out" is ticked).
- [ ] **Low stock only** lists cups at or below their alert level.

## 6. Customers
- [ ] A customer who ordered appears with orders count and total spent.
- [ ] Open them: orders, addresses; save a note and tags (e.g. `vip, office`).

## 7. Discounts
- [ ] Add a code (e.g. `WELCOME10`, 10% off the order) and use it at checkout on the website.
- [ ] Try the same code with different capitals: refused as already used.
- [ ] Edit the automatic **Mix & Match** rule (percent and minimum cups): the cart reflects it.
      An automatic rule can only be a percentage off cups.
- [ ] Set an end date in the past: the code stops working at checkout.

## 8. Settings and staff
- [ ] Change the announcement bar and delivery fee: the website shows them at once.
- [ ] Add social links (https://…): icons appear in the footer.
- [ ] As owner, give a signed-up email the **Staff** role; that person can now open /admin.
      Give them **No admin access** to remove it. Removing the last owner is refused.
- [ ] Signed in as staff (not owner), the role form is not shown.
