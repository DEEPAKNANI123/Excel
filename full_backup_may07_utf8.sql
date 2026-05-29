--
-- PostgreSQL database dump
--

\restrict Abome5WvIiqQlMtfQJRXfcHHu0H3Jkt6qHz0dzUJ5hhstwVeR1JHciwNrPwywxK

-- Dumped from database version 16.12
-- Dumped by pg_dump version 16.12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: get_reports_hierarchy(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_reports_hierarchy(manager_uuid text) RETURNS TABLE(profile_id text, level integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE reports AS (
    -- Start with direct reports
    SELECT id, 1 as level FROM profiles WHERE manager_id = manager_uuid
    UNION ALL
    -- Recursively find reports of reports
    SELECT p.id, r.level + 1 FROM profiles p
    JOIN reports r ON p.manager_id = r.id
  )
  SELECT * FROM reports;
END;
$$;


ALTER FUNCTION public.get_reports_hierarchy(manager_uuid text) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: employee_subtheme_alignment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_subtheme_alignment (
    id text DEFAULT gen_random_uuid(),
    employee_id text,
    subtheme_id text,
    cycle_year text,
    status text,
    created_at text,
    manager_feedback text
);


ALTER TABLE public.employee_subtheme_alignment OWNER TO postgres;

--
-- Name: global_subthemes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.global_subthemes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    theme_id text,
    title text,
    description text,
    created_at text,
    start_date text,
    end_date text
);


ALTER TABLE public.global_subthemes OWNER TO postgres;

--
-- Name: global_themes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.global_themes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    title text,
    description text,
    created_by text,
    created_at text,
    is_active text,
    status text DEFAULT 'active'::text,
    cycle_id text,
    department text
);


ALTER TABLE public.global_themes OWNER TO postgres;

--
-- Name: monthly_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.monthly_reviews (
    id text DEFAULT gen_random_uuid(),
    employee_id text,
    manager_id text,
    cycle_id text,
    overall_result text,
    rating_status text,
    manager_comment text,
    emp_achievements text,
    emp_blockers text,
    emp_learning text,
    emp_proof_points text,
    submitted_at text,
    attachments text,
    subtheme_id uuid,
    theme_results jsonb
);


ALTER TABLE public.monthly_reviews OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id text NOT NULL,
    employee_id text,
    first_name text,
    last_name text,
    job_title text,
    department text,
    role text,
    employment_type text,
    function text,
    sub_function text,
    manager_id text,
    created_at text,
    auth_email text,
    "USERID" text,
    "STATUS" text,
    "User Name" text,
    "First Name" text,
    "Nick" text,
    "Middle Name" text,
    "Last Name" text,
    "Suffix" text,
    "Job Title" text,
    "Gender" text,
    "Email" text,
    "Manager" text,
    "Human Resource" text,
    "Department" text,
    "Job Code" text,
    "Division" text,
    "Location" text,
    "Time Zone" text,
    "Date of Join" text,
    "Bussiness Phone" text,
    "Bussiness Fax" text,
    "Address Line 1" text,
    "Address Line 2" text,
    "City" text,
    "State" text,
    "Zip" text,
    "Country" text,
    "Matrix Manager" text,
    "Default Locale" text,
    "Proxy" text,
    "Seating Chart" text,
    "Review Frequency" text,
    "Last Review Date" text,
    "Company Exit Date" text,
    "Date of Birth" text,
    "Auto Launch PMGM Criteria" text,
    "phoneInfo-Personal" text,
    "Other Role" text,
    "Company" text,
    "Cost Center" text,
    "Business Unit" text,
    "Entity" text,
    "Section" text,
    "Sub-Section" text,
    "EmailInfo-Personal" text,
    "Person-id-external" text,
    "PhoneInfo-Business" text,
    "EmailInfo-Business" text,
    "Login Method" text,
    "Assignment ID" text,
    "Assignment UUID" text,
    "Display Name" text,
    password_hash text
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Data for Name: employee_subtheme_alignment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_subtheme_alignment (id, employee_id, subtheme_id, cycle_year, status, created_at, manager_feedback) FROM stdin;
8149c5a0-f356-4506-b224-4188f73a19dc	526cfc04-e8d3-4100-b7d4-c4b155711d0e	4a1be123-2fbf-4fcd-9062-09d417a82fb3	2026	APPROVED	2026-05-01T03:29:27.057828+00:00	\N
45e0196e-68f2-40cb-aba7-3c914e7fb37c	526cfc04-e8d3-4100-b7d4-c4b155711d0e	d7cee3aa-7d3d-45bb-a03c-5904d6827d9a	2026	APPROVED	2026-05-01T04:48:57.146999+00:00	\N
2cdb2d6d-eaf4-408d-9efc-7295449d08f8	00000000-0000-0000-0000-000000000006	51e82c17-78bd-4ea6-96a3-0fc099c5e80f	2026	APPROVED	2026-05-01T06:59:28.972173+00:00	\N
304aaaca-4ef3-44e7-b35a-e1f9c99fba5e	00000000-0000-0000-0000-000000000005	5455b013-6bda-45d4-8da7-8dbb2a1ea507	2026	APPROVED	2026-05-01T12:08:49.033904+00:00	\N
26ff399c-05e1-41b9-9558-899a399ebeac	f4590e94-7e56-4a6d-b0c3-17892a57694c	286e9d90-9634-4fbc-9a3a-469f7f2d0ea8	2026	APPROVED	2026-05-01T12:34:29.97138+00:00	\N
e6ab9904-d58e-4402-84c0-5e8b3f763dda	d414745f-8457-49d4-88e8-e5c6d605ed10	290c6616-7492-4bc8-86df-95b972e10e41	2026	APPROVED	2026-05-01T09:13:11.84076+00:00	\N
363521e3-88ff-4aa3-a525-e84bf17a79d9	e7228f73-f4bd-4007-a664-be87487ee842	5a7af93e-c6ba-4663-9856-c8fd744f61f2	2026	APPROVED	2026-05-01T13:00:31.240749+00:00	\N
51c50341-278a-480b-8159-5ab5243f67b3	526cfc04-e8d3-4100-b7d4-c4b155711d0e	bda6dd83-2d6e-4b69-ad75-84e60696b376	2026	APPROVED	2026-05-01T02:46:07.555083+00:00	\N
176ed7b7-e807-47f5-a429-e1761e817f3e	0d2de698-a2a1-4830-a74a-6195928e82de	20224833-07b0-4c1e-8a26-36fbba70071b	2026	APPROVED	2026-05-03T08:11:24.867273+00:00	\N
3ad36c8b-ec7f-49c0-9fc3-9570b90c8062	00000000-0000-0000-0000-000000000003	eee952a3-a697-4916-8a4f-c68a8fb83754	2026	REVERTED	2026-05-01T12:15:55.88431+00:00	reports are not correct
e53d0cef-2fff-492f-9d2c-9736fc7b6673	668d00c6-b6fb-4c8f-b546-7be5e98c56da	1ebbf606-e0e8-4bcd-bd8d-79fc0f886f7e	2026	PENDING	2026-05-04T11:34:16.968002+00:00	\N
45a827ee-43d8-405c-beef-cf1fadde257e	00000000-0000-0000-0000-000000000001	24d90f64-37a7-48e3-82d5-d735ce0e526a	2026	PENDING	\N	\N
4f097c6f-ec32-4160-be32-20e171eef1f6	526cfc04-e8d3-4100-b7d4-c4b155711d0e	1124ff47-57f0-45ef-b5ae-4a6bb887ae8c	2026	APPROVED	\N	\N
0e2d635c-94c4-463c-bc73-ec1033cd8e4a	526cfc04-e8d3-4100-b7d4-c4b155711d0e	7c76cc1d-059a-4b61-b50f-7326482e2f03	2026	APPROVED	\N	\N
ce43a29e-b47c-43c8-a7e8-40184362da37	f4590e94-7e56-4a6d-b0c3-17892a57694c	91e6ae84-a668-493c-96ef-decde3faa34d	2026	APPROVED	\N	\N
93388129-b597-477c-9400-4f7ca3b8c0af	f4590e94-7e56-4a6d-b0c3-17892a57694c	c9dcf004-de51-41ec-9f0d-0e7589c971cd	2026	APPROVED	\N	\N
3cb8f955-dba0-48ce-9a54-72ecd72058f7	526cfc04-e8d3-4100-b7d4-c4b155711d0e	24d90f64-37a7-48e3-82d5-d735ce0e526a	2026	APPROVED	\N	testing
fc394749-cf09-4cfe-b947-5c5ebc199a97	00000000-0000-0000-0000-000000000004	728e7fe2-35e8-494e-bfa1-451ad8fb6f32	2026	APPROVED	\N	\N
5b931db0-7346-49a5-8d93-1bc950b0fbdd	526cfc04-e8d3-4100-b7d4-c4b155711d0e	b9db2e2e-979f-4070-833f-c508f3f9acfa	2026	REVERTED	\N	Reports are Unverifed 
fbf392a9-4f3f-4426-99a9-f78734983163	526cfc04-e8d3-4100-b7d4-c4b155711d0e	ac7cc931-2b02-4a5b-b9a3-bb8fd08eb2db	2026	APPROVED	\N	\N
a74589b6-7789-4228-9f21-c029dd1a71bc	526cfc04-e8d3-4100-b7d4-c4b155711d0e	04e0092b-e3a5-45ca-a3b5-90b117d24c88	2026	PENDING	\N	\N
\.


--
-- Data for Name: global_subthemes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.global_subthemes (id, theme_id, title, description, created_at, start_date, end_date) FROM stdin;
24d90f64-37a7-48e3-82d5-d735ce0e526a	c20d19d1-2523-4211-9b2c-53bdf63fa90a	test	test	2026-05-01T02:32:06.221066+00:00	\N	\N
bda6dd83-2d6e-4b69-ad75-84e60696b376	c20d19d1-2523-4211-9b2c-53bdf63fa90a	testing	[01/02/2026 - 03/03/2026|01/05/2026] testing	2026-05-01T02:46:07.261606+00:00	\N	\N
4a1be123-2fbf-4fcd-9062-09d417a82fb3	c20d19d1-2523-4211-9b2c-53bdf63fa90a	Testing Analysis	[03/06/2026 - 05/07/2026|01/05/2026] Selinium testing is done	2026-05-01T03:29:26.848671+00:00	\N	\N
d7cee3aa-7d3d-45bb-a03c-5904d6827d9a	c20d19d1-2523-4211-9b2c-53bdf63fa90a	quality testing	[15/05/2026 - 01/06/2026|01/05/2026] automation done	2026-05-01T04:48:56.71606+00:00	\N	\N
51e82c17-78bd-4ea6-96a3-0fc099c5e80f	c20d19d1-2523-4211-9b2c-53bdf63fa90a	Frontend Development	[01/05/2026 - 10/05/2026|01/05/2026] All the bugs have been fixed	2026-05-01T06:59:28.42431+00:00	\N	\N
290c6616-7492-4bc8-86df-95b972e10e41	c20d19d1-2523-4211-9b2c-53bdf63fa90a	Frontend Development Excellence	[02/03/2026 - 05/07/2026|01/05/2026] Enhanced all the required changes	2026-05-01T09:13:11.526014+00:00	\N	\N
5455b013-6bda-45d4-8da7-8dbb2a1ea507	c20d19d1-2523-4211-9b2c-53bdf63fa90a	Backend Development	[01/05/2026 - 15/06/2026|01/05/2026] i have connected frontend to backend apis	2026-05-01T12:08:48.807188+00:00	\N	\N
eee952a3-a697-4916-8a4f-c68a8fb83754	c20d19d1-2523-4211-9b2c-53bdf63fa90a	Frontend Development	[01/02/2026 - 25/05/2026|01/05/2026] uiux changes have been implemented	2026-05-01T12:15:55.40783+00:00	\N	\N
286e9d90-9634-4fbc-9a3a-469f7f2d0ea8	c20d19d1-2523-4211-9b2c-53bdf63fa90a	Cloud Deployment	[01/01/2026 - 25/03/2026|01/05/2026] deployed in cloud aws EC2	2026-05-01T12:34:29.715406+00:00	\N	\N
5a7af93e-c6ba-4663-9856-c8fd744f61f2	c20d19d1-2523-4211-9b2c-53bdf63fa90a	Frontend	[01/02/2026 - 09/05/2026|01/05/2026] testing analysis	2026-05-01T13:00:30.813856+00:00	\N	\N
20224833-07b0-4c1e-8a26-36fbba70071b	c20d19d1-2523-4211-9b2c-53bdf63fa90a	My Contribution	[ 01/05/2026 - 31/05/2026 | 03/05/2026 ] This is by Contribution	2026-05-03T08:11:24.639177+00:00	\N	\N
1ebbf606-e0e8-4bcd-bd8d-79fc0f886f7e	c20d19d1-2523-4211-9b2c-53bdf63fa90a	Testing	[ 01/05/2026 - 03/05/2026 | 04/05/2026 ] Testing	2026-05-04T11:34:16.686995+00:00	\N	\N
1124ff47-57f0-45ef-b5ae-4a6bb887ae8c	c20d19d1-2523-4211-9b2c-53bdf63fa90a	Testing phases	[ 2026-05-01 - 2026-05-04 | 2026-05-05 ] Testing phase	\N	\N	\N
7c76cc1d-059a-4b61-b50f-7326482e2f03	c20d19d1-2523-4211-9b2c-53bdf63fa90a	Backend Development	[ 2026-05-01 - 2026-05-04 | 2026-05-05 ] Configured all the API call bugs an connected to frontend	\N	\N	\N
91e6ae84-a668-493c-96ef-decde3faa34d	c20d19d1-2523-4211-9b2c-53bdf63fa90a	Frontend Development	[ 2026-05-01 - 2026-05-05 | 2026-05-05 ] Updated UI and Improved the Text Format and Edges design	\N	\N	\N
c9dcf004-de51-41ec-9f0d-0e7589c971cd	c20d19d1-2523-4211-9b2c-53bdf63fa90a	Quality Testing	[ 2026-05-01 - 2026-05-03 | 2026-05-05 ] Manual Selenium Testing	\N	\N	\N
728e7fe2-35e8-494e-bfa1-451ad8fb6f32	c20d19d1-2523-4211-9b2c-53bdf63fa90a	Software Testing	[ 2026-05-01 - 2026-05-04 | 2026-05-05 ] Selinium Testing has been implemented	\N	\N	\N
b9db2e2e-979f-4070-833f-c508f3f9acfa	c20d19d1-2523-4211-9b2c-53bdf63fa90a	Quality Assurance	[ 2026-05-01 - 2026-05-05 | 2026-05-05 ] The records and files have sustainable issues and not fetching correctly	\N	\N	\N
ac7cc931-2b02-4a5b-b9a3-bb8fd08eb2db	c20d19d1-2523-4211-9b2c-53bdf63fa90a	FrontEnd Development	[ 2026-05-01 - 2026-05-05 | 2026-05-05 ] Testing	\N	\N	\N
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	11111111-1111-1111-1111-111111111111	Software Testing	Implement 80% code coverage across all core modules.	\N	\N	\N
bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	22222222-2222-2222-2222-222222222222	Ticket Resolution	Reduce average response time to under 4 hours.	\N	\N	\N
04e0092b-e3a5-45ca-a3b5-90b117d24c88	3c0af526-399c-48c8-adc3-032d72244496	Testing	[ 2026-05-01 - 2026-05-03 | 2026-05-06 ] Testing	\N	\N	\N
\.


--
-- Data for Name: global_themes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.global_themes (id, title, description, created_by, created_at, is_active, status, cycle_id, department) FROM stdin;
c20d19d1-2523-4211-9b2c-53bdf63fa90a	Development Excellence	[Delivery Products] needed updates regarding development phases	00000000-0000-0000-0000-000000000001	2026-04-30T20:06:43.562866+00:00	true	active	ffffffff-ffff-ffff-ffff-ffffffffffff	\N
11111111-1111-1111-1111-111111111111	Development Excellence	Focus on high-quality software delivery and architectural integrity.	\N	\N	\N	active	ffffffff-ffff-ffff-ffff-ffffffffffff	\N
22222222-2222-2222-2222-222222222222	Customer Success	Improving response times and client satisfaction metrics.	\N	\N	\N	active	ffffffff-ffff-ffff-ffff-ffffffffffff	\N
7260536b-8e21-4999-9df5-7b0ce5f24379	Quality Testing	[Technical Initiative] Post Updated Regarding Testing	00000000-0000-0000-0000-000000000001	\N	\N	active	ffffffff-ffff-ffff-ffff-ffffffffffff	\N
6f14117a-16ba-43ac-b3a8-87b9d45617dd	Quality Testing	[Strategic Contribution] Post Updates regarding Testing	00000000-0000-0000-0000-000000000001	\N	\N	active	ffffffff-ffff-ffff-ffff-ffffffffffff	\N
3c0af526-399c-48c8-adc3-032d72244496	Test	[Test] Test	00000000-0000-0000-0000-000000000001	\N	\N	active	ffffffff-ffff-ffff-ffff-ffffffffffff	\N
\.


--
-- Data for Name: monthly_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.monthly_reviews (id, employee_id, manager_id, cycle_id, overall_result, rating_status, manager_comment, emp_achievements, emp_blockers, emp_learning, emp_proof_points, submitted_at, attachments, subtheme_id, theme_results) FROM stdin;
3281988b-e682-42aa-a46b-84c09d91050c	e7228f73-f4bd-4007-a664-be87487ee842	00000000-0000-0000-0000-000000000004	ffffffff-ffff-ffff-ffff-ffffffffffff	YES	APPROVED	performance is good	testing	testing	testing	testing	2026-05-01T13:02:26.285+00:00	[{"url":"https://zkvkuxyggdlsrtkqechs.supabase.co/storage/v1/object/public/evidence/e7228f73-f4bd-4007-a664-be87487ee842_1777640466493.csv","name":"profiles_rows (5).csv","path":"e7228f73-f4bd-4007-a664-be87487ee842_1777640466493.csv"}]	\N	\N
d46d7134-5a46-4b8d-af0e-7b3aa73499db	0d2de698-a2a1-4830-a74a-6195928e82de	00000000-0000-0000-0000-000000000002	ffffffff-ffff-ffff-ffff-ffffffffffff	\N	REJECTED	details are missing					\N	[]	\N	\N
39906a23-f62e-41d7-834d-bee885eaf93d	00000000-0000-0000-0000-000000000006	00000000-0000-0000-0000-000000000002	ffffffff-ffff-ffff-ffff-ffffffffffff	\N	PENDING	\N	work done sucessfully	all the bugs solved and verified	workflows have assigned	iahve attached the evidence	\N	[{"url":"https://zkvkuxyggdlsrtkqechs.supabase.co/storage/v1/object/public/evidence/00000000-0000-0000-0000-000000000006_1777619882064.csv","name":"main_themes_rows.csv","path":"00000000-0000-0000-0000-000000000006_1777619882064.csv"}]	\N	\N
9f985cb5-504e-4b8b-a081-d2bd4fd6911d	00000000-0000-0000-0000-000000000001	00000000-0000-0000-0000-000000000001	ffffffff-ffff-ffff-ffff-ffffffffffff	\N	PENDING	\N	Enhanced all the Bugs and cleared	JWT Authentication issue occured as challenges and solved using twilo		i am attaching the screenshots as evidences 	\N	[{"url":"https://zkvkuxyggdlsrtkqechs.supabase.co/storage/v1/object/public/evidence/00000000-0000-0000-0000-000000000001_1777635913547.csv","name":"profiles_rows (4).csv","path":"00000000-0000-0000-0000-000000000001_1777635913547.csv"}]	\N	\N
1c810749-3639-4891-94f7-9ddc0bd33168	00000000-0000-0000-0000-000000000003	526cfc04-e8d3-4100-b7d4-c4b155711d0e	ffffffff-ffff-ffff-ffff-ffffffffffff	\N	PENDING	\N	UI/UX changes have sucessfully implemented 	challenge faced at creating a bot ui in the profile box	fprevious we used low light ui now upgraded to premium arabic style ui	attached the photos as references	\N	[{"url":"https://zkvkuxyggdlsrtkqechs.supabase.co/storage/v1/object/public/evidence/00000000-0000-0000-0000-000000000003_1777637922137.csv","name":"profiles_rows (6).csv","path":"00000000-0000-0000-0000-000000000003_1777637922137.csv"}]	\N	\N
51b3a8c7-f62c-47ac-8608-2d725037e064	f4590e94-7e56-4a6d-b0c3-17892a57694c	00000000-0000-0000-0000-000000000001	ffffffff-ffff-ffff-ffff-ffffffffffff	NO	APPROVED	I need updated for quarter 4	test	test	test	test	2026-05-05T06:00:59.843Z	{}	286e9d90-9634-4fbc-9a3a-469f7f2d0ea8	{"26ff399c-05e1-41b9-9558-899a399ebeac": "NO", "93388129-b597-477c-9400-4f7ca3b8c0af": "NO", "ce43a29e-b47c-43c8-a7e8-40184362da37": "NO"}
312b220d-731c-42c3-aabd-a7ed2ad0201e	f4590e94-7e56-4a6d-b0c3-17892a57694c	00000000-0000-0000-0000-000000000001	APR_2026	YES	APPROVED	\N	API bugs Solved	JWT Authentication 	Login logs Development Learning	Attached in Attachments	2026-04-15T10:00:00Z	{"{\\"name\\":\\"526cfc04-e8d3-4100-b7d4-c4b155711d0e_1777615370778 (1).xlsx\\",\\"url\\":\\"http://localhost:5000/uploads/evidence/f4590e94-7e56-4a6d-b0c3-17892a57694c_1777953818521.xlsx\\",\\"path\\":\\"f4590e94-7e56-4a6d-b0c3-17892a57694c_1777953818521.xlsx\\"}"}	286e9d90-9634-4fbc-9a3a-469f7f2d0ea8	\N
cbfb50fc-1143-4b71-93f9-f1d8f71bf1f4	526cfc04-e8d3-4100-b7d4-c4b155711d0e	00000000-0000-0000-0000-000000000001	ffffffff-ffff-ffff-ffff-ffffffffffff	YES	APPROVED	I need updated for quarter 4	testing	testing	testing	testing	2026-05-05T12:06:48.554Z	[{"url":"https://zkvkuxyggdlsrtkqechs.supabase.co/storage/v1/object/public/evidence/526cfc04-e8d3-4100-b7d4-c4b155711d0e_1777615370778.xlsx","name":"Login Details and Website URL.xlsx","path":"526cfc04-e8d3-4100-b7d4-c4b155711d0e_1777615370778.xlsx"}]	\N	{"0e2d635c-94c4-463c-bc73-ec1033cd8e4a": "YES", "26ff399c-05e1-41b9-9558-899a399ebeac": "NO", "3cb8f955-dba0-48ce-9a54-72ecd72058f7": "YES", "45e0196e-68f2-40cb-aba7-3c914e7fb37c": "NO", "4f097c6f-ec32-4160-be32-20e171eef1f6": "YES", "51c50341-278a-480b-8159-5ab5243f67b3": "YES", "8149c5a0-f356-4506-b224-4188f73a19dc": "NO", "93388129-b597-477c-9400-4f7ca3b8c0af": "NO", "ce43a29e-b47c-43c8-a7e8-40184362da37": "NO", "fbf392a9-4f3f-4426-99a9-f78734983163": "YES"}
30783e82-36ea-4b6a-af24-52241dd8cbd1	00000000-0000-0000-0000-000000000004	526cfc04-e8d3-4100-b7d4-c4b155711d0e	ffffffff-ffff-ffff-ffff-ffffffffffff	NO	APPROVED	Updated Recorded	Navigated the Dropdown Part in UI 	Occured in forward slash and backward slash	The box will be updated to show terminal part	1. Nametype for place holders	2026-05-05T12:17:08.780Z	[{"name":"profiles_rows (7).csv","url":"http://localhost:5000/uploads/evidence/00000000-0000-0000-0000-000000000004_1777963205206.csv","path":"00000000-0000-0000-0000-000000000004_1777963205206.csv"}]	728e7fe2-35e8-494e-bfa1-451ad8fb6f32	{"fc394749-cf09-4cfe-b947-5c5ebc199a97": "NO"}
70a7a684-d2e9-45a7-961b-d13d07bf1a0d	f4590e94-7e56-4a6d-b0c3-17892a57694c	00000000-0000-0000-0000-000000000001	ffffffff-ffff-ffff-ffff-ffffffffffff	\N	APPROVED	\N	Better UI Designing Performance 	Login Email errors Configured	Using JWT Authentication Mapped the correct email with Passwords	Attached under attachments	\N	{"{\\"name\\":\\"Data Structures Alignment Tables.xlsx\\",\\"url\\":\\"http://localhost:5000/uploads/evidence/f4590e94-7e56-4a6d-b0c3-17892a57694c_1777956358889.xlsx\\",\\"path\\":\\"f4590e94-7e56-4a6d-b0c3-17892a57694c_1777956358889.xlsx\\"}"}	91e6ae84-a668-493c-96ef-decde3faa34d	\N
0e586eb4-c9f4-40ac-ae8c-ccd955aba415	f4590e94-7e56-4a6d-b0c3-17892a57694c	00000000-0000-0000-0000-000000000001	APR_2026	NO	APPROVED	okk	Testing	Testing	Testing	Testing	2026-04-12T14:30:00Z	{"{\\"name\\":\\"monthly_reviews_rows (3).csv\\",\\"url\\":\\"http://localhost:5000/uploads/evidence/f4590e94-7e56-4a6d-b0c3-17892a57694c_1777956896965.csv\\",\\"path\\":\\"f4590e94-7e56-4a6d-b0c3-17892a57694c_1777956896965.csv\\"}"}	c9dcf004-de51-41ec-9f0d-0e7589c971cd	{"26ff399c-05e1-41b9-9558-899a399ebeac": "NEUTRAL", "93388129-b597-477c-9400-4f7ca3b8c0af": "NEUTRAL", "ce43a29e-b47c-43c8-a7e8-40184362da37": "NEUTRAL"}
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profiles (id, employee_id, first_name, last_name, job_title, department, role, employment_type, function, sub_function, manager_id, created_at, auth_email, "USERID", "STATUS", "User Name", "First Name", "Nick", "Middle Name", "Last Name", "Suffix", "Job Title", "Gender", "Email", "Manager", "Human Resource", "Department", "Job Code", "Division", "Location", "Time Zone", "Date of Join", "Bussiness Phone", "Bussiness Fax", "Address Line 1", "Address Line 2", "City", "State", "Zip", "Country", "Matrix Manager", "Default Locale", "Proxy", "Seating Chart", "Review Frequency", "Last Review Date", "Company Exit Date", "Date of Birth", "Auto Launch PMGM Criteria", "phoneInfo-Personal", "Other Role", "Company", "Cost Center", "Business Unit", "Entity", "Section", "Sub-Section", "EmailInfo-Personal", "Person-id-external", "PhoneInfo-Business", "EmailInfo-Business", "Login Method", "Assignment ID", "Assignment UUID", "Display Name", password_hash) FROM stdin;
00000000-0000-0000-0000-000000000001	EMP001	Alexander	Vance	Head of Department	Corporate	hod	PERMANENT	Engineering	\N	\N	2026-04-30T13:52:20.007257+00:00	alexgender@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$Juj5JEk3rRRaslG7cSzjfe/cxchshfAapzDtojw8dFlu32FVdj8k.
526cfc04-e8d3-4100-b7d4-c4b155711d0e	EMP020	Sarah	Jenkins	HR BP	HR	hr	PERMANENT	Human Resources	\N	00000000-0000-0000-0000-000000000001	2026-04-30T13:52:20.007257+00:00	sarahjenkins@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$4sIFxR5.yINHakhlODhvNe2BOpCwp2CBg6UrgUTiI8Kb.KXGyciOO
d414745f-8457-49d4-88e8-e5c6d605ed10	EMP015	Paul	Rudd	Fullstack Dev	Engineering	employee	PERMANENT	Engineering	\N	00000000-0000-0000-0000-000000000004	2026-04-30T13:52:20.007257+00:00	paulrudd@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$2R3oVa77flKCT2ihtOeDbuNLsLwO.9Zeo4UXVms8d5T3mtGhQJJE6
e5c0e479-0723-41bc-944a-3001e0556aaf	EMP017	Idris	Elba	Cloud Lead	Engineering	employee	PERMANENT	Engineering	\N	00000000-0000-0000-0000-000000000004	2026-04-30T13:52:20.007257+00:00	idriselba@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$LlYP7eF4XGR1mtYlpfzhleWcwBs0tqbe5tNAyCQgidBvmCaz8CIfe
00000000-0000-0000-0000-000000000002	EMP002	Sarah	Chen	Engineering Manager	Core Dev	manager	PERMANENT	Engineering	\N	526cfc04-e8d3-4100-b7d4-c4b155711d0e	2026-04-30T13:52:20.007257+00:00	sarah.chen@company.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$wudT/7xjBho5ut1GzMQLfeRlmlByQlus9Q9jklEGDACVP8oxqZ/NW
e7228f73-f4bd-4007-a664-be87487ee842	EMP007	Tom	Hanks	Senior Designer	Product	employee	PERMANENT	Product	\N	00000000-0000-0000-0000-000000000004	2026-04-30T13:52:20.007257+00:00	tomhanks@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$RyuuS0ga05peg36f7q3uSODI859AV0aU7hhRzEE297eOaOLs5fQli
ea2b486a-7f35-4673-a6b3-6d9f2885c77b	EMP012	Oscar	Wilde	Ops Executive	Ops	employee	PERMANENT	Operations	\N	00000000-0000-0000-0000-000000000004	2026-04-30T13:52:20.007257+00:00	oscarwilde@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$7M6hg8Q37JSFDamuNFYkKu4y0M3ImDREkxuwfLl22Z5hhHcqZ2Wb.
f4590e94-7e56-4a6d-b0c3-17892a57694c	EMP016	Tessa	Thompson	DBA	Engineering	employee	PERMANENT	Engineering	\N	00000000-0000-0000-0000-000000000001	2026-04-30T13:52:20.007257+00:00	tessathompson@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$QleppO8sM.b.OGBU9jU6jeLzr9wQXtzu0NkVnpmh1URU.fFeQcosy
f76ed73b-19b7-46a8-bc42-14b28e931cdc	EMP011	Nina	Simone	Analyst	Product	employee	PERMANENT	Product	\N	00000000-0000-0000-0000-000000000003	2026-04-30T13:52:20.007257+00:00	ninasimone@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$qmzm9WrvLphIm7pD1lLWLuKf11Yzz4aahAyEHeykMSIASzqrZq7vW
00000000-0000-0000-0000-000000000006	EMP006	Julia	Soto	Senior Dev	\N	employee	PERMANENT	Engineering	\N	00000000-0000-0000-0000-000000000002	2026-04-30T13:52:20.007257+00:00	juliosoto@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$Qunsv1JShGnrkKZ0weAGMemYCDHLHFmOwkN3wK8acJV3ohJxVgK5G
00000000-0000-0000-0000-000000000003	EMP003	Marcus	Reed	Product Lead	Product	manager	PERMANENT	Product	\N	526cfc04-e8d3-4100-b7d4-c4b155711d0e	2026-04-30T13:52:20.007257+00:00	marcusreed@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$WQAvHl9TvkEsYbqe4IF6Qe.3Vlk9rvMvzIWTzphqFLRVqen8II9lq
00000000-0000-0000-0000-000000000004	EMP004	Elena	Rossi	Ops Director	Ops	manager	PERMANENT	Operations	\N	526cfc04-e8d3-4100-b7d4-c4b155711d0e	2026-04-30T13:52:20.007257+00:00	elenarossie@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$0FhAV3RMMhhL9R.OarqtneRmqbVQiCU8.pzlFhFDGTQELlShpMQwi
00000000-0000-0000-0000-000000000005	EMP005	David	Kim	Tech Lead	\N	manager	PERMANENT	Engineering	\N	00000000-0000-0000-0000-000000000001	2026-04-30T13:52:20.007257+00:00	davidkim@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$8ZIR54zt17jL0/2cqN9Pze8p/5uc4ZWumTynk6KTcn5UePxMbtJFC
0d2de698-a2a1-4830-a74a-6195928e82de	EMP014	Zoe	Kravitz	UI Eng	Engineering	employee	PERMANENT	Engineering	\N	00000000-0000-0000-0000-000000000002	2026-04-30T13:52:20.007257+00:00	zoekravit@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$NYYykdyOjuur7pTfNV5mnu54jSpJ48brQqDTr4TjQrMaq/na/Zt3y
1d52493e-5ba4-42f3-b7bc-70e86ef49a98	EMP008	Leo	Miller	Backend Dev	Engineering	employee	PERMANENT	Engineering	\N	00000000-0000-0000-0000-000000000002	2026-04-30T13:52:20.007257+00:00	leomiller@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$A6Hi2Jw8wukmC0S8zpR1Qe7U8/bN6Wbb4QIUPbi5t9zCktbcQLvka
262a27f1-2cdc-4971-a714-56c73bbfa41d	EMP019	Will	Smith	Security Eng	Engineering	employee	PERMANENT	Engineering	\N	00000000-0000-0000-0000-000000000002	2026-04-30T13:52:20.007257+00:00	willsmith@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$gniYE8YELplQfPXdl5wn/.60DuS2w3ki31fiHy9e44.4BeRH/kxsi
2fb0e02b-30de-482d-9f4f-5b586b1c9366	EMP013	Maya	Angelou	Ops Support	Ops	employee	PROBATION	Operations	\N	00000000-0000-0000-0000-000000000003	2026-04-30T13:52:20.007257+00:00	maya@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$RnnDH4xtSzCEgqIlphgf3uKmG5vLDnu43hA3xCg9OOhftKqFn6wxC
32b295f4-3c6c-4b8b-90d6-59237662500e	EMP018	Gal	Gadot	Data Sci	Engineering	employee	PERMANENT	Engineering	\N	00000000-0000-0000-0000-000000000003	2026-04-30T13:52:20.007257+00:00	galgadot@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$MOWpnjQh6YFq/.7K6kA0JO4ROYMmI6FK2IT9FPFLwKI7KM.vr9pW.
668d00c6-b6fb-4c8f-b546-7be5e98c56da	EMP009	Anna	White	Junior Dev	Engineering	employee	PROBATION	Engineering	\N	00000000-0000-0000-0000-000000000003	2026-04-30T13:52:20.007257+00:00	annawhite@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$lMp/6R3Ds0s5BIRfAR9Uk.qjZjw3lTZpXNacyEMNHnG7kogYztZya
97af2045-8c9d-4ef7-9ccf-40c7f3786dfd	EMP010	Chris	Evans	QA Specialist	Engineering	employee	PERMANENT	Engineering	\N	00000000-0000-0000-0000-000000000003	2026-04-30T13:52:20.007257+00:00	chrisevans@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	$2b$10$yS4PRsjrhDYB9KKrm2N28.t6GINN6PwvvMoVDsmmP6hpYHHZrs80m
\.


--
-- Name: employee_subtheme_alignment employee_subtheme_alignment_employee_id_subtheme_id_cycle_y_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_subtheme_alignment
    ADD CONSTRAINT employee_subtheme_alignment_employee_id_subtheme_id_cycle_y_key UNIQUE (employee_id, subtheme_id, cycle_year);


--
-- Name: global_subthemes global_subthemes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.global_subthemes
    ADD CONSTRAINT global_subthemes_pkey PRIMARY KEY (id);


--
-- Name: global_themes global_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.global_themes
    ADD CONSTRAINT global_themes_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict Abome5WvIiqQlMtfQJRXfcHHu0H3Jkt6qHz0dzUJ5hhstwVeR1JHciwNrPwywxK

