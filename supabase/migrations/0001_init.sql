-- Mintly DB Schema for Unicity Sphere testnet2
-- Run this in your Supabase SQL editor or psql

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  seller_nametag text not null,
  seller_address text not null,
  image_url text not null,
  title text not null default 'Untitled NFT',
  description text not null default '',
  floor_price_uct numeric not null,
  current_price_uct numeric not null,
  status text not null default 'listed',
  created_at timestamptz not null default now(),
  last_price_update_at timestamptz not null default now()
);

create table if not exists price_history (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  price_uct numeric not null,
  changed_by text not null default 'agent',
  created_at timestamptz not null default now()
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  buyer_nametag text not null,
  buyer_address text not null,
  seller_nametag text not null,
  price_uct numeric not null,
  payment_request_id text,
  tx_id text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create table if not exists activity_feed (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id),
  event_type text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_listings_status on listings(status);
create index if not exists idx_listings_seller on listings(seller_nametag);
create index if not exists idx_price_history_listing on price_history(listing_id);
create index if not exists idx_purchases_listing on purchases(listing_id);
create index if not exists idx_purchases_buyer on purchases(buyer_nametag);
create index if not exists idx_purchases_status on purchases(status);
create index if not exists idx_activity_feed_created on activity_feed(created_at desc);
