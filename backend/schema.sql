-- =========================================================
-- KisanSetu National Unified Procurement Platform Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/ffebmyslijheubhpndla/sql
-- =========================================================

-- 1. Drop existing conflicting tables cleanly
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.land_parcels CASCADE;
DROP TABLE IF EXISTS public.farmers CASCADE;
DROP TABLE IF EXISTS public.centres CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Farmers Profile & Security Registry
CREATE TABLE public.farmers (
    id TEXT PRIMARY KEY,
    aadhaar_number VARCHAR(12) UNIQUE,
    aadhaar_masked VARCHAR(20),
    farmer_name VARCHAR(150) NOT NULL,
    father_name VARCHAR(150),
    dob VARCHAR(20),
    age VARCHAR(20),
    gender VARCHAR(20),
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    password_hash TEXT,
    village VARCHAR(100),
    tehsil VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    address TEXT,
    bank_name VARCHAR(150),
    account_no VARCHAR(50),
    account_masked VARCHAR(30),
    account_holder_name VARCHAR(150),
    ifsc VARCHAR(20),
    branch VARCHAR(100),
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Procurement Centres & Mandis
CREATE TABLE public.centres (
    id TEXT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    distance VARCHAR(50),
    daily_capacity_tonnes NUMERIC DEFAULT 50,
    reserved_tonnes NUMERIC DEFAULT 0,
    crop VARCHAR(100) DEFAULT 'Wheat',
    msp_rate_per_qtl NUMERIC DEFAULT 2425,
    officer_name VARCHAR(150),
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Land Parcels & Cadastral Records
CREATE TABLE public.land_parcels (
    id TEXT PRIMARY KEY,
    farmer_id TEXT REFERENCES public.farmers(id) ON DELETE CASCADE,
    khasra_no VARCHAR(50) NOT NULL,
    area_hectare NUMERIC NOT NULL,
    soil_type VARCHAR(100),
    crop VARCHAR(100),
    irrigation VARCHAR(100),
    ownership VARCHAR(150),
    state VARCHAR(100),
    district VARCHAR(100),
    tehsil VARCHAR(100),
    village VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    source VARCHAR(150) DEFAULT 'AgriStack Sync',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Procurement Slot Bookings & Mandi Queue Workflows
CREATE TABLE public.bookings (
    id TEXT PRIMARY KEY,
    farmer_id TEXT REFERENCES public.farmers(id) ON DELETE SET NULL,
    farmer_name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20),
    aadhaar_masked VARCHAR(20),
    crop VARCHAR(100) NOT NULL,
    season VARCHAR(100) DEFAULT 'Rabi season',
    centre_id TEXT REFERENCES public.centres(id) ON DELETE SET NULL,
    centre_name VARCHAR(200),
    khasra_no TEXT,
    area_hectares NUMERIC,
    expected_tonnes NUMERIC NOT NULL,
    date DATE NOT NULL,
    slot_time VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'BOOKED', -- BOOKED | CHECKED_IN | QUALITY_WAITING | QUALITY_PASSED | WEIGHING_PROCESS | PROCUREMENT_COMPLETED | CANCELLED
    check_in_time VARCHAR(30),
    quality_result JSONB,
    actual_weight_tonnes NUMERIC,
    net_payable_amount NUMERIC,
    payment_ref VARCHAR(100),
    payment_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Disable Row Level Security (RLS) or Allow Full Access for Direct Anon Access
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for farmers" ON public.farmers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for centres" ON public.centres FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for land_parcels" ON public.land_parcels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

-- 7. Enable Real-Time Replication for Live Mandi Updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.land_parcels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.centres;

-- 8. Insert Initial Procurement Centres
INSERT INTO public.centres (id, name, district, state, distance, daily_capacity_tonnes, reserved_tonnes, crop, msp_rate_per_qtl, officer_name, phone)
VALUES 
  ('C001', 'Kherli Krishi Upaj Mandi', 'Alwar', 'Rajasthan', '4.2 km', 50, 38, 'Wheat', 2425, 'Rajesh Sharma', '+91 98290 11223'),
  ('C002', 'Mahwa Procurement Hub', 'Dausa', 'Rajasthan', '9.8 km', 45, 29, 'Wheat', 2425, 'Vikram Meena', '+91 98290 44556'),
  ('C003', 'Mandawar Grain Center', 'Dausa', 'Rajasthan', '13.4 km', 60, 52, 'Mustard', 5650, 'Anil Gurjar', '+91 98290 77889')
ON CONFLICT (id) DO NOTHING;

-- 9. Insert 10 Initial Verified Demo Farmer Profiles
INSERT INTO public.farmers (
  id, aadhaar_number, aadhaar_masked, farmer_name, father_name, dob, age, gender, 
  mobile, email, password_hash, village, tehsil, district, state, pincode, address, 
  bank_name, account_no, account_masked, account_holder_name, ifsc, branch
)
VALUES 
  ('F101', '542188904829', 'XXXX-XXXX-4829', 'Ramesh Kumar', 'Shri Ramphal Kumar', '14/08/1980', '46 Years', 'Male', '+91 98765 43210', 'ramesh.kumar.farmer@gmail.com', 'kisan@123', 'Kherli Kalan', 'Kherli', 'Alwar', 'Rajasthan', '321606', 'House No. 42, Village Kherli Kalan, Tehsil Kherli, District Alwar, Rajasthan - 321606', 'State Bank of India', '308291048921', 'XXXX-XXXX-8921', 'Ramesh Kumar', 'SBIN0001429', 'Kherli Main Branch'),
  ('F102', '987654321098', 'XXXX-XXXX-1098', 'Suresh Chand Meena', 'Shri Babulal Meena', '22/11/1985', '41 Years', 'Male', '+91 98290 12345', 'suresh.meena@gmail.com', 'kisan@123', 'Lalsot Rural', 'Lalsot', 'Dausa', 'Rajasthan', '303503', 'Village Lalsot Rural, Tehsil Lalsot, District Dausa, Rajasthan - 303503', 'Punjab National Bank', '189201944421', 'XXXX-XXXX-4421', 'Suresh Chand Meena', 'PUNB0189200', 'Lalsot Main Branch'),
  ('F103', '123456789012', 'XXXX-XXXX-9012', 'Baldev Singh Gurjar', 'Shri Harchand Gurjar', '05/03/1978', '48 Years', 'Male', '+91 94140 56789', 'baldev.gurjar@gmail.com', 'kisan@123', 'Bayana Rural', 'Bayana', 'Bharatpur', 'Rajasthan', '321401', 'Village Bayana Rural, Tehsil Bayana, District Bharatpur, Rajasthan - 321401', 'Bank of Baroda', '0456010003312', 'XXXX-XXXX-3312', 'Baldev Singh Gurjar', 'BARB0BAYANA', 'Bayana Branch'),
  ('F104', '234567890123', 'XXXX-XXXX-0123', 'Mahendra Choudhary', 'Shri Narayan Choudhary', '18/06/1982', '44 Years', 'Male', '+91 98280 11223', 'mahendra.jaipur@gmail.com', 'kisan@123', 'Chomu Central', 'Chomu', 'Jaipur', 'Rajasthan', '303702', 'Kishan Colony, Chomu Central, Tehsil Chomu, District Jaipur, Rajasthan - 303702', 'HDFC Bank', '50100492817788', 'XXXX-XXXX-7788', 'Mahendra Choudhary', 'HDFC0001890', 'Chomu Branch'),
  ('F105', '345678901234', 'XXXX-XXXX-1234', 'Omprakash Jat', 'Shri Jagdish Prasad Jat', '12/09/1975', '51 Years', 'Male', '+91 94600 22334', 'omprakash.jat@gmail.com', 'kisan@123', 'Fatehpur Shekhawati', 'Fatehpur', 'Sikar', 'Rajasthan', '332301', 'Village Fatehpur Shekhawati, Tehsil Fatehpur, District Sikar, Rajasthan - 332301', 'Canara Bank', '2198101006541', 'XXXX-XXXX-6541', 'Omprakash Jat', 'CNRB0002198', 'Fatehpur Branch'),
  ('F106', '456789012345', 'XXXX-XXXX-2345', 'Ramswaroop Sharma', 'Shri Laxminarayan Sharma', '30/01/1981', '45 Years', 'Male', '+91 97850 33445', 'ramswaroop.sharma@gmail.com', 'kisan@123', 'Kishangarh Rural', 'Kishangarh', 'Ajmer', 'Rajasthan', '305801', 'Village Kishangarh Rural, Tehsil Kishangarh, District Ajmer, Rajasthan - 305801', 'State Bank of India', '319208499912', 'XXXX-XXXX-9912', 'Ramswaroop Sharma', 'SBIN0031890', 'Kishangarh Branch'),
  ('F107', '567890123456', 'XXXX-XXXX-3456', 'Mohan Lal Dangi', 'Shri Chunilal Dangi', '20/07/1979', '47 Years', 'Male', '+91 94130 44556', 'mohan.dangi@gmail.com', 'kisan@123', 'Mavli Rural', 'Mavli', 'Udaipur', 'Rajasthan', '313203', 'Village Mavli Rural, Tehsil Mavli, District Udaipur, Rajasthan - 313203', 'Bank of India', '660110110005543', 'XXXX-XXXX-5543', 'Mohan Lal Dangi', 'BKID0006601', 'Mavli Branch'),
  ('F108', '678901234567', 'XXXX-XXXX-4567', 'Jaswant Singh Sidhu', 'Sardar Gurdeep Singh Sidhu', '11/12/1983', '43 Years', 'Male', '+91 98720 55667', 'jaswant.sidhu@gmail.com', 'kisan@123', 'Suratgarh Rural', 'Suratgarh', 'Sri Ganganagar', 'Rajasthan', '335804', 'Chak 14-SGM, Suratgarh Rural, Tehsil Suratgarh, District Sri Ganganagar, Rajasthan - 335804', 'Punjab & Sind Bank', '0789100001122', 'XXXX-XXXX-1122', 'Jaswant Singh Sidhu', 'PSIB0000789', 'Suratgarh Branch'),
  ('F109', '789012345678', 'XXXX-XXXX-5678', 'Gopi Ram Bishnoi', 'Shri Shivlal Bishnoi', '15/04/1977', '49 Years', 'Male', '+91 94140 66778', 'gopiram.bishnoi@gmail.com', 'kisan@123', 'Nokha Rural', 'Nokha', 'Bikaner', 'Rajasthan', '334803', 'Mukam Road, Nokha Rural, Tehsil Nokha, District Bikaner, Rajasthan - 334803', 'Union Bank of India', '441202010008877', 'XXXX-XXXX-8877', 'Gopi Ram Bishnoi', 'UBIN0544124', 'Nokha Branch'),
  ('F110', '890123456789', 'XXXX-XXXX-6789', 'Kalyan Singh Rajput', 'Shri Bhawani Singh Rajput', '25/09/1984', '42 Years', 'Male', '+91 98290 77889', 'kalyan.rajput@gmail.com', 'kisan@123', 'Ramganj Mandi Rural', 'Ramganj Mandi', 'Kota', 'Rajasthan', '326519', 'Village Ramganj Mandi Rural, Tehsil Ramganj Mandi, District Kota, Rajasthan - 326519', 'State Bank of India', '338819202244', 'XXXX-XXXX-2244', 'Kalyan Singh Rajput', 'SBIN0001844', 'Ramganj Mandi Branch')
ON CONFLICT (id) DO NOTHING;

-- 10. Insert Initial Verified Land Parcels (5 to 8 Parcels per Farmer)
INSERT INTO public.land_parcels (id, farmer_id, khasra_no, area_hectare, soil_type, crop, verified, source, state, district, tehsil, village)
VALUES
  -- Ramesh Kumar (Alwar)
  ('L101', 'F101', '142/3', 1.5, 'Alluvial / Loamy', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Alwar', 'Kherli', 'Kherli Kalan'),
  ('L102', 'F101', '87/2', 0.8, 'Sandy Loam', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Alwar', 'Kherli', 'Kherli Kalan'),
  ('L103', 'F101', '204/1', 2.1, 'Alluvial / Loamy', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Alwar', 'Kherli', 'Kherli Kalan'),
  ('L104', 'F101', '78/4', 1.1, 'Clay Loam', 'Barley', TRUE, 'AgriStack Sync', 'Rajasthan', 'Alwar', 'Kherli', 'Kherli Kalan'),
  ('L105', 'F101', '311/2', 0.9, 'Sandy Loam', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Alwar', 'Kherli', 'Kherli Kalan'),
  ('L106', 'F101', '95/A', 1.4, 'Alluvial / Loamy', 'Gram (Chana)', TRUE, 'AgriStack Sync', 'Rajasthan', 'Alwar', 'Kherli', 'Kherli Kalan'),
  -- Suresh Chand Meena (Dausa)
  ('L201', 'F102', '312/1', 2.1, 'Clay Loam', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Dausa', 'Lalsot', 'Lalsot Rural'),
  ('L202', 'F102', '45/A', 1.3, 'Sandy Loam', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Dausa', 'Lalsot', 'Lalsot Rural'),
  ('L203', 'F102', '119/2', 1.8, 'Alluvial / Loamy', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Dausa', 'Lalsot', 'Lalsot Rural'),
  ('L204', 'F102', '78/3', 0.9, 'Clay Loam', 'Gram (Chana)', TRUE, 'AgriStack Sync', 'Rajasthan', 'Dausa', 'Lalsot', 'Lalsot Rural'),
  ('L205', 'F102', '91/B', 1.6, 'Sandy Loam', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Dausa', 'Lalsot', 'Lalsot Rural'),
  ('L206', 'F102', '155/4', 0.7, 'Alluvial / Loamy', 'Barley', TRUE, 'AgriStack Sync', 'Rajasthan', 'Dausa', 'Lalsot', 'Lalsot Rural'),
  ('L207', 'F102', '230/1', 2.4, 'Clay Loam', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Dausa', 'Lalsot', 'Lalsot Rural'),
  -- Baldev Singh Gurjar (Bharatpur)
  ('L301', 'F103', '210/1', 1.7, 'Alluvial / Loamy', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Bharatpur', 'Bayana', 'Bayana Rural'),
  ('L302', 'F103', '88/3', 2.3, 'Clay Loam', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Bharatpur', 'Bayana', 'Bayana Rural'),
  ('L303', 'F103', '164/2', 0.9, 'Sandy Loam', 'Gram (Chana)', TRUE, 'AgriStack Sync', 'Rajasthan', 'Bharatpur', 'Bayana', 'Bayana Rural'),
  ('L304', 'F103', '340/5', 1.4, 'Alluvial / Loamy', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Bharatpur', 'Bayana', 'Bayana Rural'),
  ('L305', 'F103', '72/1', 1.1, 'Clay Loam', 'Barley', TRUE, 'AgriStack Sync', 'Rajasthan', 'Bharatpur', 'Bayana', 'Bayana Rural'),
  -- Mahendra Choudhary (Jaipur)
  ('L401', 'F104', '101/A', 1.2, 'Alluvial / Loamy', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Jaipur', 'Chomu', 'Chomu Central'),
  ('L402', 'F104', '205/2', 1.9, 'Sandy Loam', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Jaipur', 'Chomu', 'Chomu Central'),
  ('L403', 'F104', '309/1', 0.8, 'Alluvial / Loamy', 'Barley', TRUE, 'AgriStack Sync', 'Rajasthan', 'Jaipur', 'Chomu', 'Chomu Central'),
  ('L404', 'F104', '412/3', 2.2, 'Clay Loam', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Jaipur', 'Chomu', 'Chomu Central'),
  ('L405', 'F104', '518/4', 1.5, 'Sandy Loam', 'Gram (Chana)', TRUE, 'AgriStack Sync', 'Rajasthan', 'Jaipur', 'Chomu', 'Chomu Central'),
  ('L406', 'F104', '620/2', 0.6, 'Alluvial / Loamy', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Jaipur', 'Chomu', 'Chomu Central'),
  ('L407', 'F104', '715/1', 1.7, 'Clay Loam', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Jaipur', 'Chomu', 'Chomu Central'),
  ('L408', 'F104', '802/3', 1.0, 'Sandy Loam', 'Barley', TRUE, 'AgriStack Sync', 'Rajasthan', 'Jaipur', 'Chomu', 'Chomu Central'),
  -- Omprakash Jat (Sikar)
  ('L501', 'F105', '55/2', 2.5, 'Sandy Loam', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Sikar', 'Fatehpur', 'Fatehpur Shekhawati'),
  ('L502', 'F105', '132/1', 1.8, 'Sandy Loam', 'Gram (Chana)', TRUE, 'AgriStack Sync', 'Rajasthan', 'Sikar', 'Fatehpur', 'Fatehpur Shekhawati'),
  ('L503', 'F105', '245/3', 1.2, 'Alluvial / Loamy', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Sikar', 'Fatehpur', 'Fatehpur Shekhawati'),
  ('L504', 'F105', '360/4', 2.0, 'Sandy Loam', 'Barley', TRUE, 'AgriStack Sync', 'Rajasthan', 'Sikar', 'Fatehpur', 'Fatehpur Shekhawati'),
  ('L505', 'F105', '475/2', 0.9, 'Sandy Loam', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Sikar', 'Fatehpur', 'Fatehpur Shekhawati'),
  ('L506', 'F105', '580/1', 1.5, 'Alluvial / Loamy', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Sikar', 'Fatehpur', 'Fatehpur Shekhawati'),
  -- Ramswaroop Sharma (Ajmer)
  ('L601', 'F106', '82/1', 1.3, 'Alluvial / Loamy', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Ajmer', 'Kishangarh', 'Kishangarh Rural'),
  ('L602', 'F106', '190/3', 2.1, 'Clay Loam', 'Gram (Chana)', TRUE, 'AgriStack Sync', 'Rajasthan', 'Ajmer', 'Kishangarh', 'Kishangarh Rural'),
  ('L603', 'F106', '275/2', 0.8, 'Sandy Loam', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Ajmer', 'Kishangarh', 'Kishangarh Rural'),
  ('L604', 'F106', '388/4', 1.6, 'Alluvial / Loamy', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Ajmer', 'Kishangarh', 'Kishangarh Rural'),
  ('L605', 'F106', '492/1', 1.0, 'Clay Loam', 'Barley', TRUE, 'AgriStack Sync', 'Rajasthan', 'Ajmer', 'Kishangarh', 'Kishangarh Rural'),
  ('L606', 'F106', '560/3', 1.4, 'Sandy Loam', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Ajmer', 'Kishangarh', 'Kishangarh Rural'),
  ('L607', 'F106', '633/2', 0.7, 'Alluvial / Loamy', 'Gram (Chana)', TRUE, 'AgriStack Sync', 'Rajasthan', 'Ajmer', 'Kishangarh', 'Kishangarh Rural'),
  -- Mohan Lal Dangi (Udaipur)
  ('L701', 'F107', '66/3', 1.8, 'Red & Black Soil', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Udaipur', 'Mavli', 'Mavli Rural'),
  ('L702', 'F107', '145/2', 1.1, 'Clay Loam', 'Gram (Chana)', TRUE, 'AgriStack Sync', 'Rajasthan', 'Udaipur', 'Mavli', 'Mavli Rural'),
  ('L703', 'F107', '280/1', 2.3, 'Red & Black Soil', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Udaipur', 'Mavli', 'Mavli Rural'),
  ('L704', 'F107', '395/4', 0.9, 'Alluvial / Loamy', 'Barley', TRUE, 'AgriStack Sync', 'Rajasthan', 'Udaipur', 'Mavli', 'Mavli Rural'),
  ('L705', 'F107', '510/2', 1.4, 'Clay Loam', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Udaipur', 'Mavli', 'Mavli Rural'),
  -- Jaswant Singh Sidhu (Sri Ganganagar)
  ('L801', 'F108', '12/1', 2.8, 'Canal Alluvial', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Sri Ganganagar', 'Suratgarh', 'Suratgarh Rural'),
  ('L802', 'F108', '48/2', 3.1, 'Canal Alluvial', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Sri Ganganagar', 'Suratgarh', 'Suratgarh Rural'),
  ('L803', 'F108', '104/3', 1.5, 'Canal Alluvial', 'Gram (Chana)', TRUE, 'AgriStack Sync', 'Rajasthan', 'Sri Ganganagar', 'Suratgarh', 'Suratgarh Rural'),
  ('L804', 'F108', '220/1', 2.0, 'Canal Alluvial', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Sri Ganganagar', 'Suratgarh', 'Suratgarh Rural'),
  ('L805', 'F108', '315/4', 1.8, 'Canal Alluvial', 'Barley', TRUE, 'AgriStack Sync', 'Rajasthan', 'Sri Ganganagar', 'Suratgarh', 'Suratgarh Rural'),
  ('L806', 'F108', '428/2', 2.4, 'Canal Alluvial', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Sri Ganganagar', 'Suratgarh', 'Suratgarh Rural'),
  ('L807', 'F108', '530/3', 1.2, 'Canal Alluvial', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Sri Ganganagar', 'Suratgarh', 'Suratgarh Rural'),
  ('L808', 'F108', '645/1', 2.5, 'Canal Alluvial', 'Gram (Chana)', TRUE, 'AgriStack Sync', 'Rajasthan', 'Sri Ganganagar', 'Suratgarh', 'Suratgarh Rural'),
  -- Gopi Ram Bishnoi (Bikaner)
  ('L901', 'F109', '94/2', 3.2, 'Desert Sandy Loam', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Bikaner', 'Nokha', 'Nokha Rural'),
  ('L902', 'F109', '180/1', 2.5, 'Desert Sandy Loam', 'Gram (Chana)', TRUE, 'AgriStack Sync', 'Rajasthan', 'Bikaner', 'Nokha', 'Nokha Rural'),
  ('L903', 'F109', '265/4', 1.8, 'Desert Sandy Loam', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Bikaner', 'Nokha', 'Nokha Rural'),
  ('L904', 'F109', '370/3', 2.1, 'Desert Sandy Loam', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Bikaner', 'Nokha', 'Nokha Rural'),
  ('L905', 'F109', '485/1', 1.4, 'Desert Sandy Loam', 'Barley', TRUE, 'AgriStack Sync', 'Rajasthan', 'Bikaner', 'Nokha', 'Nokha Rural'),
  ('L906', 'F109', '590/2', 2.9, 'Desert Sandy Loam', 'Gram (Chana)', TRUE, 'AgriStack Sync', 'Rajasthan', 'Bikaner', 'Nokha', 'Nokha Rural'),
  -- Kalyan Singh Rajput (Kota)
  ('L1001', 'F110', '71/3', 2.0, 'Black Cotton Soil', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Kota', 'Ramganj Mandi', 'Ramganj Mandi Rural'),
  ('L1002', 'F110', '158/2', 1.6, 'Black Cotton Soil', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Kota', 'Ramganj Mandi', 'Ramganj Mandi Rural'),
  ('L1003', 'F110', '240/1', 1.2, 'Clay Loam', 'Gram (Chana)', TRUE, 'AgriStack Sync', 'Rajasthan', 'Kota', 'Ramganj Mandi', 'Ramganj Mandi Rural'),
  ('L1004', 'F110', '355/4', 2.4, 'Black Cotton Soil', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Kota', 'Ramganj Mandi', 'Ramganj Mandi Rural'),
  ('L1005', 'F110', '462/3', 0.8, 'Clay Loam', 'Barley', TRUE, 'AgriStack Sync', 'Rajasthan', 'Kota', 'Ramganj Mandi', 'Ramganj Mandi Rural'),
  ('L1006', 'F110', '575/2', 1.9, 'Black Cotton Soil', 'Mustard', TRUE, 'AgriStack Sync', 'Rajasthan', 'Kota', 'Ramganj Mandi', 'Ramganj Mandi Rural'),
  ('L1007', 'F110', '680/1', 1.5, 'Black Cotton Soil', 'Wheat', TRUE, 'AgriStack Sync', 'Rajasthan', 'Kota', 'Ramganj Mandi', 'Ramganj Mandi Rural')
ON CONFLICT (id) DO NOTHING;

-- 11. Insert Initial Active Bookings
INSERT INTO public.bookings (
  id, farmer_id, farmer_name, mobile, aadhaar_masked, crop, season, centre_id, centre_name, 
  khasra_no, area_hectares, expected_tonnes, date, slot_time, status, check_in_time, 
  quality_result, actual_weight_tonnes, net_payable_amount, payment_ref, payment_date
)
VALUES
  ('KKS-WHT-2026-000421', 'F101', 'Ramesh Kumar', '+91 98765 43210', 'XXXX-XXXX-4829', 'Wheat', 'Rabi season', 'C001', 'Kherli Krishi Upaj Mandi', '142/3', 1.5, 8.0, '2026-09-29', '10:00–10:20 AM', 'BOOKED', NULL, NULL, NULL, NULL, NULL, NULL),
  ('KKS-WHT-2026-000318', 'F101', 'Ramesh Kumar', '+91 98765 43210', 'XXXX-XXXX-4829', 'Wheat', 'Rabi season', 'C001', 'Kherli Krishi Upaj Mandi', '142/3, 87/2', 2.3, 7.5, '2026-09-22', '11:00–11:20 AM', 'PROCUREMENT_COMPLETED', '10:50 AM', '{"pass": true, "moisture": "11.2%", "grade": "Grade-A"}'::jsonb, 7.42, 179935, 'PFMS-2026-DBT-8839201', '2026-09-22')
ON CONFLICT (id) DO NOTHING;

