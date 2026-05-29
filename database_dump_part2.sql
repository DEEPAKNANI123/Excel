-- PostgreSQL Schema Dump Part 2

CREATE TABLE IF NOT EXISTS public."global_themes" (
    "id" TEXT,
    "title" TEXT,
    "description" TEXT,
    "created_by" TEXT,
    "created_at" TEXT,
    "is_active" TEXT
);

INSERT INTO public."global_themes" ("id", "title", "description", "created_by", "created_at", "is_active") VALUES ('c20d19d1-2523-4211-9b2c-53bdf63fa90a', 'Development Excellence', '[Delivery Products] needed updates regarding development phases', '00000000-0000-0000-0000-000000000001', '2026-04-30T20:06:43.562866+00:00', true);

CREATE TABLE IF NOT EXISTS public."global_subthemes" (
    "id" TEXT,
    "theme_id" TEXT,
    "title" TEXT,
    "description" TEXT,
    "created_at" TEXT,
    "start_date" TEXT,
    "end_date" TEXT
);

INSERT INTO public."global_subthemes" ("id", "theme_id", "title", "description", "created_at", "start_date", "end_date") VALUES ('24d90f64-37a7-48e3-82d5-d735ce0e526a', 'c20d19d1-2523-4211-9b2c-53bdf63fa90a', 'test', 'test', '2026-05-01T02:32:06.221066+00:00', NULL, NULL);
INSERT INTO public."global_subthemes" ("id", "theme_id", "title", "description", "created_at", "start_date", "end_date") VALUES ('bda6dd83-2d6e-4b69-ad75-84e60696b376', 'c20d19d1-2523-4211-9b2c-53bdf63fa90a', 'testing', '[01/02/2026 - 03/03/2026|01/05/2026] testing', '2026-05-01T02:46:07.261606+00:00', NULL, NULL);
INSERT INTO public."global_subthemes" ("id", "theme_id", "title", "description", "created_at", "start_date", "end_date") VALUES ('4a1be123-2fbf-4fcd-9062-09d417a82fb3', 'c20d19d1-2523-4211-9b2c-53bdf63fa90a', 'Testing Analysis', '[03/06/2026 - 05/07/2026|01/05/2026] Selinium testing is done', '2026-05-01T03:29:26.848671+00:00', NULL, NULL);
INSERT INTO public."global_subthemes" ("id", "theme_id", "title", "description", "created_at", "start_date", "end_date") VALUES ('d7cee3aa-7d3d-45bb-a03c-5904d6827d9a', 'c20d19d1-2523-4211-9b2c-53bdf63fa90a', 'quality testing', '[15/05/2026 - 01/06/2026|01/05/2026] automation done', '2026-05-01T04:48:56.71606+00:00', NULL, NULL);
INSERT INTO public."global_subthemes" ("id", "theme_id", "title", "description", "created_at", "start_date", "end_date") VALUES ('51e82c17-78bd-4ea6-96a3-0fc099c5e80f', 'c20d19d1-2523-4211-9b2c-53bdf63fa90a', 'Frontend Development', '[01/05/2026 - 10/05/2026|01/05/2026] All the bugs have been fixed', '2026-05-01T06:59:28.42431+00:00', NULL, NULL);
INSERT INTO public."global_subthemes" ("id", "theme_id", "title", "description", "created_at", "start_date", "end_date") VALUES ('290c6616-7492-4bc8-86df-95b972e10e41', 'c20d19d1-2523-4211-9b2c-53bdf63fa90a', 'Frontend Development Excellence', '[02/03/2026 - 05/07/2026|01/05/2026] Enhanced all the required changes', '2026-05-01T09:13:11.526014+00:00', NULL, NULL);
INSERT INTO public."global_subthemes" ("id", "theme_id", "title", "description", "created_at", "start_date", "end_date") VALUES ('5455b013-6bda-45d4-8da7-8dbb2a1ea507', 'c20d19d1-2523-4211-9b2c-53bdf63fa90a', 'Backend Development', '[01/05/2026 - 15/06/2026|01/05/2026] i have connected frontend to backend apis', '2026-05-01T12:08:48.807188+00:00', NULL, NULL);
INSERT INTO public."global_subthemes" ("id", "theme_id", "title", "description", "created_at", "start_date", "end_date") VALUES ('eee952a3-a697-4916-8a4f-c68a8fb83754', 'c20d19d1-2523-4211-9b2c-53bdf63fa90a', 'Frontend Development', '[01/02/2026 - 25/05/2026|01/05/2026] uiux changes have been implemented', '2026-05-01T12:15:55.40783+00:00', NULL, NULL);
INSERT INTO public."global_subthemes" ("id", "theme_id", "title", "description", "created_at", "start_date", "end_date") VALUES ('286e9d90-9634-4fbc-9a3a-469f7f2d0ea8', 'c20d19d1-2523-4211-9b2c-53bdf63fa90a', 'Cloud Deployment', '[01/01/2026 - 25/03/2026|01/05/2026] deployed in cloud aws EC2', '2026-05-01T12:34:29.715406+00:00', NULL, NULL);
INSERT INTO public."global_subthemes" ("id", "theme_id", "title", "description", "created_at", "start_date", "end_date") VALUES ('5a7af93e-c6ba-4663-9856-c8fd744f61f2', 'c20d19d1-2523-4211-9b2c-53bdf63fa90a', 'Frontend', '[01/02/2026 - 09/05/2026|01/05/2026] testing analysis', '2026-05-01T13:00:30.813856+00:00', NULL, NULL);
INSERT INTO public."global_subthemes" ("id", "theme_id", "title", "description", "created_at", "start_date", "end_date") VALUES ('20224833-07b0-4c1e-8a26-36fbba70071b', 'c20d19d1-2523-4211-9b2c-53bdf63fa90a', 'My Contribution', '[ 01/05/2026 - 31/05/2026 | 03/05/2026 ] This is by Contribution', '2026-05-03T08:11:24.639177+00:00', NULL, NULL);
INSERT INTO public."global_subthemes" ("id", "theme_id", "title", "description", "created_at", "start_date", "end_date") VALUES ('1ebbf606-e0e8-4bcd-bd8d-79fc0f886f7e', 'c20d19d1-2523-4211-9b2c-53bdf63fa90a', 'Testing', '[ 01/05/2026 - 03/05/2026 | 04/05/2026 ] Testing', '2026-05-04T11:34:16.686995+00:00', NULL, NULL);

CREATE TABLE IF NOT EXISTS public."employee_subtheme_alignment" (
    "id" TEXT,
    "employee_id" TEXT,
    "subtheme_id" TEXT,
    "cycle_year" TEXT,
    "status" TEXT,
    "created_at" TEXT,
    "manager_feedback" TEXT
);

INSERT INTO public."employee_subtheme_alignment" ("id", "employee_id", "subtheme_id", "cycle_year", "status", "created_at", "manager_feedback") VALUES ('8149c5a0-f356-4506-b224-4188f73a19dc', '526cfc04-e8d3-4100-b7d4-c4b155711d0e', '4a1be123-2fbf-4fcd-9062-09d417a82fb3', 2026, 'APPROVED', '2026-05-01T03:29:27.057828+00:00', NULL);
INSERT INTO public."employee_subtheme_alignment" ("id", "employee_id", "subtheme_id", "cycle_year", "status", "created_at", "manager_feedback") VALUES ('45e0196e-68f2-40cb-aba7-3c914e7fb37c', '526cfc04-e8d3-4100-b7d4-c4b155711d0e', 'd7cee3aa-7d3d-45bb-a03c-5904d6827d9a', 2026, 'APPROVED', '2026-05-01T04:48:57.146999+00:00', NULL);
INSERT INTO public."employee_subtheme_alignment" ("id", "employee_id", "subtheme_id", "cycle_year", "status", "created_at", "manager_feedback") VALUES ('2cdb2d6d-eaf4-408d-9efc-7295449d08f8', '00000000-0000-0000-0000-000000000006', '51e82c17-78bd-4ea6-96a3-0fc099c5e80f', 2026, 'APPROVED', '2026-05-01T06:59:28.972173+00:00', NULL);
INSERT INTO public."employee_subtheme_alignment" ("id", "employee_id", "subtheme_id", "cycle_year", "status", "created_at", "manager_feedback") VALUES ('304aaaca-4ef3-44e7-b35a-e1f9c99fba5e', '00000000-0000-0000-0000-000000000005', '5455b013-6bda-45d4-8da7-8dbb2a1ea507', 2026, 'APPROVED', '2026-05-01T12:08:49.033904+00:00', NULL);
INSERT INTO public."employee_subtheme_alignment" ("id", "employee_id", "subtheme_id", "cycle_year", "status", "created_at", "manager_feedback") VALUES ('26ff399c-05e1-41b9-9558-899a399ebeac', 'f4590e94-7e56-4a6d-b0c3-17892a57694c', '286e9d90-9634-4fbc-9a3a-469f7f2d0ea8', 2026, 'APPROVED', '2026-05-01T12:34:29.97138+00:00', NULL);
INSERT INTO public."employee_subtheme_alignment" ("id", "employee_id", "subtheme_id", "cycle_year", "status", "created_at", "manager_feedback") VALUES ('e6ab9904-d58e-4402-84c0-5e8b3f763dda', 'd414745f-8457-49d4-88e8-e5c6d605ed10', '290c6616-7492-4bc8-86df-95b972e10e41', 2026, 'APPROVED', '2026-05-01T09:13:11.84076+00:00', NULL);
INSERT INTO public."employee_subtheme_alignment" ("id", "employee_id", "subtheme_id", "cycle_year", "status", "created_at", "manager_feedback") VALUES ('363521e3-88ff-4aa3-a525-e84bf17a79d9', 'e7228f73-f4bd-4007-a664-be87487ee842', '5a7af93e-c6ba-4663-9856-c8fd744f61f2', 2026, 'APPROVED', '2026-05-01T13:00:31.240749+00:00', NULL);
INSERT INTO public."employee_subtheme_alignment" ("id", "employee_id", "subtheme_id", "cycle_year", "status", "created_at", "manager_feedback") VALUES ('51c50341-278a-480b-8159-5ab5243f67b3', '526cfc04-e8d3-4100-b7d4-c4b155711d0e', 'bda6dd83-2d6e-4b69-ad75-84e60696b376', 2026, 'APPROVED', '2026-05-01T02:46:07.555083+00:00', NULL);
INSERT INTO public."employee_subtheme_alignment" ("id", "employee_id", "subtheme_id", "cycle_year", "status", "created_at", "manager_feedback") VALUES ('176ed7b7-e807-47f5-a429-e1761e817f3e', '0d2de698-a2a1-4830-a74a-6195928e82de', '20224833-07b0-4c1e-8a26-36fbba70071b', 2026, 'APPROVED', '2026-05-03T08:11:24.867273+00:00', NULL);
INSERT INTO public."employee_subtheme_alignment" ("id", "employee_id", "subtheme_id", "cycle_year", "status", "created_at", "manager_feedback") VALUES ('3ad36c8b-ec7f-49c0-9fc3-9570b90c8062', '00000000-0000-0000-0000-000000000003', 'eee952a3-a697-4916-8a4f-c68a8fb83754', 2026, 'REVERTED', '2026-05-01T12:15:55.88431+00:00', 'reports are not correct');
INSERT INTO public."employee_subtheme_alignment" ("id", "employee_id", "subtheme_id", "cycle_year", "status", "created_at", "manager_feedback") VALUES ('e53d0cef-2fff-492f-9d2c-9736fc7b6673', '668d00c6-b6fb-4c8f-b546-7be5e98c56da', '1ebbf606-e0e8-4bcd-bd8d-79fc0f886f7e', 2026, 'PENDING', '2026-05-04T11:34:16.968002+00:00', NULL);

