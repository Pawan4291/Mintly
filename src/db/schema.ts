import { pgTable, uuid, text, numeric, timestamp, integer, boolean, type AnyPgColumn } from 'drizzle-orm/pg-core';

export const listings = pgTable('listings', {
  maxPerWallet: integer('max_per_wallet'),
  id: uuid('id').primaryKey().defaultRandom(),
  sellerNametag: text('seller_nametag').notNull(),
  sellerAddress: text('seller_address').notNull(),
  imageUrl: text('image_url').notNull(),
  title: text('title').notNull().default('Untitled NFT'),
  description: text('description').notNull().default(''),
  floorPriceUct: numeric('floor_price_uct').notNull(),
  totalSupply: integer('total_supply').notNull().default(1),
  soldCount: integer('sold_count').notNull().default(0),
  currentPriceUct: numeric('current_price_uct').notNull(),
 status: text('status').notNull().default('listed'),
  isResale: boolean('is_resale').notNull().default(false),
  isFixedPrice: boolean('is_fixed_price').notNull().default(false),
  sourcePurchaseId: uuid('source_purchase_id').references((): AnyPgColumn => purchases.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastPriceUpdateAt: timestamp('last_price_update_at', { withTimezone: true }).notNull().defaultNow(),
});

export const priceHistory = pgTable('price_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id),
  priceUct: numeric('price_uct').notNull(),
  changedBy: text('changed_by').notNull().default('agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const purchases = pgTable('purchases', {
  quantity: integer('quantity').notNull().default(1),
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id),
  buyerNametag: text('buyer_nametag').notNull(),
  buyerAddress: text('buyer_address').notNull(),
  sellerNametag: text('seller_nametag').notNull(),
  priceUct: numeric('price_uct').notNull(),
  paymentRequestId: text('payment_request_id'),
  txId: text('tx_id'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
});

export const activityFeed = pgTable('activity_feed', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').references(() => listings.id),
  eventType: text('event_type').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type NewPriceHistory = typeof priceHistory.$inferInsert;
export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
export type ActivityFeed = typeof activityFeed.$inferSelect;
export type NewActivityFeed = typeof activityFeed.$inferInsert;
