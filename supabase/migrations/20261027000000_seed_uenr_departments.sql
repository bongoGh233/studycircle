-- Seed the official UENR academic department catalog
-- Source: https://uenr.edu.gh/academic-departments-and-programmes/
-- Verified against the live page on 26 October 2026.
--
-- Run in the Supabase SQL Editor. Safe to re-run.
-- The departments.id column is text, so stable slugs are used instead of UUIDs.

insert into public.departments (id, name, is_active) values
  -- Engineering
  ('eng-mechanical-manufacturing',      'Department of Mechanical & Manufacturing Engineering', true),
  ('eng-electrical-computer',           'Department of Electrical & Computer Engineering', true),
  ('eng-civil-environmental',           'Department of Civil & Environmental Engineering', true),
  ('eng-agricultural',                  'Department of Agricultural Engineering', true),
  -- Energy
  ('energy-renewable',                  'Department of Renewable Energy Engineering', true),
  ('energy-petroleum-gas',              'Department of Petroleum and Natural Gas Engineering', true),
  -- Natural Resources
  ('nr-forest-science',                 'Department of Forest Science', true),
  ('nr-fisheries-aquatic',              'Department of Fisheries and Aquatic Sciences', true),
  ('nr-environmental-management',       'Department of Environmental Management', true),
  ('nr-ecotourism',                     'Department of Ecotourism, Recreation & Hospitality', true),
  ('nr-fire-safety',                    'Department of Fire, Safety & Disaster Management', true),
  -- Sciences
  ('sci-chemical',                      'Department of Chemical Sciences', true),
  ('sci-computer-science',              'Department of Computer Science & Informatics', true),
  ('sci-mathematics-statistics',        'Department of Mathematics & Statistics', true),
  ('sci-nursing',                       'Department of Nursing', true),
  ('sci-biological',                    'Department of Biological Sciences', true),
  ('sci-medical-laboratory',            'Department of Medical Laboratory & Health Sciences', true),
  ('sci-information-technology',        'Department of Information Technology', true),
  -- Agriculture and Technology
  ('agri-agribusiness',                 'Department of Agribusiness & Consumer Studies', true),
  ('agri-horticulture',                 'Department of Horticulture & Crop Production', true),
  ('agri-animal-production',            'Department of Animal Production & Health', true),
  ('agri-resource-economics',           'Department of Agricultural & Resource Economics', true),
  ('agri-food-science',                 'Department of Food Science & Technology', true),
  -- Geoscience
  ('geo-geological',                    'Department of Geological Science', true),
  ('geo-geospatial',                    'Department of Geospatial Sciences', true),
  ('geo-climate',                       'Department of Climate Science', true),
  ('geo-geography-sustainability',      'Department of Geography & Sustainability Science', true),
  -- Arts and Social Sciences
  ('arts-entrepreneurship',             'Department of Entrepreneurship and Business Sciences', true),
  ('arts-economics',                    'Department of Economics', true),
  -- Mines and Built Environment
  ('mines-land-management',             'Department of Land Management', true),
  ('mines-mineral-resources',           'Department of Sustainable Mineral Resource Development', true)
on conflict (id) do update
  set name = excluded.name,
      is_active = true;

-- Verify: should return 31.
select count(*) as active_departments
from public.departments
where is_active = true;
