-- Critical #1: Zaključavanje PII kreatora na nivou baze.
--
-- Problem: politika "Anyone can view approved creators" je dozvoljavala
-- SELECT CELOG REDA (uključujući email, phone, lat, lng) svima sa anon
-- ključem (koji je ugrađen u frontend), zaobilazeći paywall iz API-ja.
-- Takođe, RPC creators_nearby/creators_by_city su bili EXECUTE za anon i
-- vraćali pune redove.
--
-- Rešenje: marketplace se servira ISKLJUČIVO preko API-ja (service-role),
-- pa anon/authenticated ne treba direktan pristup tabeli creators niti RPC-ovima.
-- Zadržavamo own-row (kreator vidi/menja svoj profil) i admin politike.

-- 1. Ukloni javnu politiku koja je izlagala ceo red odobrenih kreatora
DROP POLICY IF EXISTS "Anyone can view approved creators" ON public.creators;

-- 2. anon nema nikakav direktan pristup tabeli creators
REVOKE ALL ON public.creators FROM anon;

-- 3. authenticated zadržava SELECT + UPDATE (RLS ih ograničava na vlastiti red);
--    uklanjamo opasne write/DDL grantove
REVOKE INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.creators FROM authenticated;

-- 4. RPC funkcije se zovu samo preko service-role API-ja → ukloni anon/public EXECUTE
REVOKE EXECUTE ON FUNCTION public.creators_nearby(double precision, double precision, double precision) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.creators_by_city() FROM PUBLIC, anon, authenticated;
