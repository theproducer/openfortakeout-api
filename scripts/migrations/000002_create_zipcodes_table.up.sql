CREATE TABLE IF NOT EXISTS public.zipcodes (
    id serial PRIMARY KEY,
    zipcode TEXT UNIQUE NOT NULL,
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL
);

CREATE INDEX zipcodes_idx ON public.zipcodes ( zipcode );