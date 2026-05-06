# Security Specification - Botaniq Store

## Data Invariants
- Products can only be modified by admins.
- Settings can only be modified by admins.
- Orders can be created by anyone but only read by admins.
- Once an order is created, it cannot be modified or deleted via the client SDK.

## The "Dirty Dozen" Payloads (Denial Tests)
1. **Unauthenticated Write**: Attempt to create a product without login.
2. **Standard User Write**: Attempt to create a product as a non-admin.
3. **Identity Spoofing**: Attempt to create an order as an admin if not verified.
4. **Product Deletion**: Non-admin attempting to delete a product.
5. **Settings Tamper**: Standard user trying to change the WhatsApp link in Settings.
6. **Order Scraping**: Standard user attempting to list all orders.
7. **Order Mutation**: User attempting to change their order status to "delivered".
8. **Invalid ID Poisoning**: Attempt to create a product with a 2KB document ID.
9. **Shadow Field Injection**: Adding `isVerified: true` to a guest order.
10. **Resource Exhaustion**: Sending a 1MB string in the product description.
11. **PII Leakage**: Attempting to read another customer's order by ID.
12. **Status Jumping**: Attempting to create an order with status 'delivered' directly.

## Rules Evaluation
- **Identity Spoofing**: Blocked by `isAdmin()` check.
- **State Shortcutting**: Blocked by `allow update: if false` for orders.
- **Resource Poisoning**: Basic type checks and size constraints in rules.
