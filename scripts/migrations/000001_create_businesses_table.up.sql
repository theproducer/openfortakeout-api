CREATE TABLE IF NOT EXISTS public.businesses (
    id serial PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
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

CREATE INDEX businesses_gix ON public.businesses USING GIST ( location );