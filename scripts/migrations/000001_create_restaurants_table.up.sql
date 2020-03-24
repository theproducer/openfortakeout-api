CREATE TABLE IF NOT EXISTS public.restaurants (
    id serial PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    details TEXT,
    hours TEXT,
    url TEXT,
    address TEXT,
    address2 TEXT,
    city TEXT,
    state TEXT,
    zipcode TEXT,
    location GEOGRAPHY(POINT, 4326),
    donate_url TEXT,
    giftcard BOOLEAN,
    is_active BOOLEAN,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP 
);

CREATE INDEX restaurants_gix ON public.restaurants USING GIST ( location );