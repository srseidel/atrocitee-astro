-- Seed initial charity data for testing and production
-- These are sample charities that users can select as their default

-- Insert sample charities (only if they don't already exist)
INSERT INTO charities (id, name, description, website_url, active, created_at, updated_at)
VALUES 
    (
        gen_random_uuid(),
        'American Red Cross',
        'The American Red Cross shelters, feeds and provides comfort to victims of disasters; supplies about 40% of the nation''s blood; teaches skills that save lives; distributes international humanitarian aid; and supports veterans, military members and their families.',
        'https://www.redcross.org',
        true,
        now(),
        now()
    ),
    (
        gen_random_uuid(),
        'Doctors Without Borders',
        'Doctors Without Borders/Médecins Sans Frontières (MSF) is an international humanitarian organization that provides medical assistance to people affected by conflict, epidemics, disasters, or exclusion from healthcare.',
        'https://www.doctorswithoutborders.org',
        true,
        now(),
        now()
    ),
    (
        gen_random_uuid(),
        'World Wildlife Fund',
        'WWF is an international non-governmental organization working on issues regarding the conservation, research and restoration of the environment.',
        'https://www.worldwildlife.org',
        true,
        now(),
        now()
    ),
    (
        gen_random_uuid(),
        'Habitat for Humanity',
        'Habitat for Humanity is a global nonprofit housing organization working in local communities across all 50 states in the U.S. and in approximately 70 countries.',
        'https://www.habitat.org',
        true,
        now(),
        now()
    ),
    (
        gen_random_uuid(),
        'Feeding America',
        'Feeding America is a United States-based nonprofit organization that is a nationwide network of more than 200 food banks that feed more than 46 million people through food pantries, soup kitchens, shelters, and other community-based agencies.',
        'https://www.feedingamerica.org',
        true,
        now(),
        now()
    ),
    (
        gen_random_uuid(),
        'St. Jude Children''s Research Hospital',
        'St. Jude Children''s Research Hospital, founded in 1962, is a pediatric treatment and research facility focused on children''s catastrophic diseases, particularly leukemia and other cancers.',
        'https://www.stjude.org',
        true,
        now(),
        now()
    ),
    (
        gen_random_uuid(),
        'United Way',
        'United Way is a nonprofit organization that pools contributions from individuals in a community to fund local health and human services organizations.',
        'https://www.unitedway.org',
        true,
        now(),
        now()
    ),
    (
        gen_random_uuid(),
        'Amnesty International',
        'Amnesty International is a non-governmental organization focused on human rights, with its headquarters in the United Kingdom.',
        'https://www.amnesty.org',
        true,
        now(),
        now()
    )
ON CONFLICT (name) DO NOTHING;