-- Seed 10 reusable permanent access codes for private alpha.
insert into access_codes (code_hash, access_duration_days, is_single_use)
values
  (encode(sha256('ALPHA-ZB3Q-P338'), 'hex'), null, false),
  (encode(sha256('ALPHA-A360-ZI3X'), 'hex'), null, false),
  (encode(sha256('ALPHA-3SDF-7FH0'), 'hex'), null, false),
  (encode(sha256('ALPHA-HUAX-OVYL'), 'hex'), null, false),
  (encode(sha256('ALPHA-9LA5-OU3V'), 'hex'), null, false),
  (encode(sha256('ALPHA-MBV2-EUPA'), 'hex'), null, false),
  (encode(sha256('ALPHA-YER2-GLLQ'), 'hex'), null, false),
  (encode(sha256('ALPHA-FCS5-7IT4'), 'hex'), null, false),
  (encode(sha256('ALPHA-PD3A-0U82'), 'hex'), null, false),
  (encode(sha256('ALPHA-PWG2-9VCA'), 'hex'), null, false)
on conflict do nothing;
