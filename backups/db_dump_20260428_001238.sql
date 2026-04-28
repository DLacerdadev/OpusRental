--
-- PostgreSQL database dump
--

\restrict MFwm5DxXi8dF2G79p0wfyKohtPUOmn8m2jVKMzywgPlQoApfc2JqBTwxe6GJwJm

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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

ALTER TABLE IF EXISTS ONLY public.whatsapp_logs DROP CONSTRAINT IF EXISTS whatsapp_logs_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.trailers DROP CONSTRAINT IF EXISTS trailers_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.tracking_data DROP CONSTRAINT IF EXISTS tracking_data_trailer_id_trailers_id_fk;
ALTER TABLE IF EXISTS ONLY public.tracking_data DROP CONSTRAINT IF EXISTS tracking_data_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.shares DROP CONSTRAINT IF EXISTS shares_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.shares DROP CONSTRAINT IF EXISTS shares_trailer_id_trailers_id_fk;
ALTER TABLE IF EXISTS ONLY public.shares DROP CONSTRAINT IF EXISTS shares_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.rental_contracts DROP CONSTRAINT IF EXISTS rental_contracts_trailer_id_trailers_id_fk;
ALTER TABLE IF EXISTS ONLY public.rental_contracts DROP CONSTRAINT IF EXISTS rental_contracts_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.rental_contracts DROP CONSTRAINT IF EXISTS rental_contracts_client_id_rental_clients_id_fk;
ALTER TABLE IF EXISTS ONLY public.rental_clients DROP CONSTRAINT IF EXISTS rental_clients_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_share_id_shares_id_fk;
ALTER TABLE IF EXISTS ONLY public.partner_shops DROP CONSTRAINT IF EXISTS partner_shops_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_trailer_id_trailers_id_fk;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.maintenance_schedules DROP CONSTRAINT IF EXISTS maintenance_schedules_trailer_id_trailers_id_fk;
ALTER TABLE IF EXISTS ONLY public.maintenance_schedules DROP CONSTRAINT IF EXISTS maintenance_schedules_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_contract_id_rental_contracts_id_fk;
ALTER TABLE IF EXISTS ONLY public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_invoice_id_invoices_id_fk;
ALTER TABLE IF EXISTS ONLY public.gps_devices DROP CONSTRAINT IF EXISTS gps_devices_trailer_id_trailers_id_fk;
ALTER TABLE IF EXISTS ONLY public.gps_devices DROP CONSTRAINT IF EXISTS gps_devices_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.financial_records DROP CONSTRAINT IF EXISTS financial_records_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.email_logs DROP CONSTRAINT IF EXISTS email_logs_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_share_id_shares_id_fk;
ALTER TABLE IF EXISTS ONLY public.checklists DROP CONSTRAINT IF EXISTS checklists_trailer_id_trailers_id_fk;
ALTER TABLE IF EXISTS ONLY public.checklists DROP CONSTRAINT IF EXISTS checklists_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.checklists DROP CONSTRAINT IF EXISTS checklists_approved_by_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.broker_emails DROP CONSTRAINT IF EXISTS broker_emails_trailer_id_trailers_id_fk;
ALTER TABLE IF EXISTS ONLY public.broker_dispatches DROP CONSTRAINT IF EXISTS broker_dispatches_trailer_id_trailers_id_fk;
ALTER TABLE IF EXISTS ONLY public.broker_dispatches DROP CONSTRAINT IF EXISTS broker_dispatches_tenant_id_tenants_id_fk;
ALTER TABLE IF EXISTS ONLY public.broker_dispatches DROP CONSTRAINT IF EXISTS broker_dispatches_created_by_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_tenant_id_tenants_id_fk;
DROP INDEX IF EXISTS public.uniq_tenant_username;
DROP INDEX IF EXISTS public.uniq_tenant_trailer_id;
DROP INDEX IF EXISTS public.uniq_tenant_tax_id;
DROP INDEX IF EXISTS public.uniq_tenant_month;
DROP INDEX IF EXISTS public.uniq_tenant_email;
DROP INDEX IF EXISTS public.uniq_tenant_dispatch_number;
DROP INDEX IF EXISTS public.uniq_tenant_device_id;
DROP INDEX IF EXISTS public.uniq_tenant_contract_number;
DROP INDEX IF EXISTS public.uniq_payments_share_month;
DROP INDEX IF EXISTS public.uniq_invoices_tenant_invoice_number;
DROP INDEX IF EXISTS public.uniq_invoices_contract_month;
DROP INDEX IF EXISTS public.idx_whatsapp_logs_tenant;
DROP INDEX IF EXISTS public.idx_whatsapp_logs_status;
DROP INDEX IF EXISTS public.idx_whatsapp_logs_event;
DROP INDEX IF EXISTS public.idx_tracking_trailer;
DROP INDEX IF EXISTS public.idx_tracking_tenant;
DROP INDEX IF EXISTS public.idx_shares_user;
DROP INDEX IF EXISTS public.idx_shares_trailer;
DROP INDEX IF EXISTS public.idx_shares_tenant;
DROP INDEX IF EXISTS public.idx_payments_user_month;
DROP INDEX IF EXISTS public.idx_payments_tenant;
DROP INDEX IF EXISTS public.idx_partner_shops_tenant;
DROP INDEX IF EXISTS public.idx_notification_user;
DROP INDEX IF EXISTS public.idx_notification_type;
DROP INDEX IF EXISTS public.idx_notification_tenant;
DROP INDEX IF EXISTS public.idx_notification_read;
DROP INDEX IF EXISTS public.idx_notification_created;
DROP INDEX IF EXISTS public.idx_maintenance_trailer;
DROP INDEX IF EXISTS public.idx_maintenance_tenant;
DROP INDEX IF EXISTS public.idx_maintenance_status;
DROP INDEX IF EXISTS public.idx_invoices_tenant;
DROP INDEX IF EXISTS public.idx_invoices_status;
DROP INDEX IF EXISTS public.idx_invoices_due_date;
DROP INDEX IF EXISTS public.idx_invoice_items_tenant;
DROP INDEX IF EXISTS public.idx_invoice_items_invoice;
DROP INDEX IF EXISTS public.idx_email_logs_type;
DROP INDEX IF EXISTS public.idx_email_logs_tenant;
DROP INDEX IF EXISTS public.idx_email_logs_recipient;
DROP INDEX IF EXISTS public.idx_email_logs_entity;
DROP INDEX IF EXISTS public.idx_documents_user;
DROP INDEX IF EXISTS public.idx_documents_tenant;
DROP INDEX IF EXISTS public.idx_contracts_trailer;
DROP INDEX IF EXISTS public.idx_contracts_status;
DROP INDEX IF EXISTS public.idx_contracts_client;
DROP INDEX IF EXISTS public.idx_checklists_type;
DROP INDEX IF EXISTS public.idx_checklists_trailer;
DROP INDEX IF EXISTS public.idx_checklists_tenant;
DROP INDEX IF EXISTS public.idx_checklists_approved;
DROP INDEX IF EXISTS public.idx_broker_emails_trailer;
DROP INDEX IF EXISTS public.idx_broker_emails_status;
DROP INDEX IF EXISTS public.idx_broker_dispatch_trailer;
DROP INDEX IF EXISTS public.idx_broker_dispatch_status;
DROP INDEX IF EXISTS public.idx_broker_dispatch_pickup;
DROP INDEX IF EXISTS public.idx_audit_logs_tenant;
DROP INDEX IF EXISTS public."IDX_session_expire";
ALTER TABLE IF EXISTS ONLY public.whatsapp_logs DROP CONSTRAINT IF EXISTS whatsapp_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.trailers DROP CONSTRAINT IF EXISTS trailers_pkey;
ALTER TABLE IF EXISTS ONLY public.tracking_data DROP CONSTRAINT IF EXISTS tracking_data_pkey;
ALTER TABLE IF EXISTS ONLY public.tenants DROP CONSTRAINT IF EXISTS tenants_slug_unique;
ALTER TABLE IF EXISTS ONLY public.tenants DROP CONSTRAINT IF EXISTS tenants_pkey;
ALTER TABLE IF EXISTS ONLY public.shares DROP CONSTRAINT IF EXISTS shares_pkey;
ALTER TABLE IF EXISTS ONLY public.session DROP CONSTRAINT IF EXISTS session_pkey;
ALTER TABLE IF EXISTS ONLY public.rental_contracts DROP CONSTRAINT IF EXISTS rental_contracts_pkey;
ALTER TABLE IF EXISTS ONLY public.rental_clients DROP CONSTRAINT IF EXISTS rental_clients_pkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_pkey;
ALTER TABLE IF EXISTS ONLY public.partner_shops DROP CONSTRAINT IF EXISTS partner_shops_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.maintenance_schedules DROP CONSTRAINT IF EXISTS maintenance_schedules_pkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_pkey;
ALTER TABLE IF EXISTS ONLY public.gps_devices DROP CONSTRAINT IF EXISTS gps_devices_pkey;
ALTER TABLE IF EXISTS ONLY public.financial_records DROP CONSTRAINT IF EXISTS financial_records_pkey;
ALTER TABLE IF EXISTS ONLY public.email_settings DROP CONSTRAINT IF EXISTS email_settings_setting_key_unique;
ALTER TABLE IF EXISTS ONLY public.email_settings DROP CONSTRAINT IF EXISTS email_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.email_logs DROP CONSTRAINT IF EXISTS email_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_pkey;
ALTER TABLE IF EXISTS ONLY public.checklists DROP CONSTRAINT IF EXISTS checklists_pkey;
ALTER TABLE IF EXISTS ONLY public.broker_emails DROP CONSTRAINT IF EXISTS broker_emails_pkey;
ALTER TABLE IF EXISTS ONLY public.broker_dispatches DROP CONSTRAINT IF EXISTS broker_dispatches_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
DROP TABLE IF EXISTS public.whatsapp_logs;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.trailers;
DROP TABLE IF EXISTS public.tracking_data;
DROP TABLE IF EXISTS public.tenants;
DROP TABLE IF EXISTS public.shares;
DROP TABLE IF EXISTS public.session;
DROP TABLE IF EXISTS public.rental_contracts;
DROP TABLE IF EXISTS public.rental_clients;
DROP TABLE IF EXISTS public.payments;
DROP TABLE IF EXISTS public.partner_shops;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.maintenance_schedules;
DROP TABLE IF EXISTS public.invoices;
DROP TABLE IF EXISTS public.invoice_items;
DROP TABLE IF EXISTS public.gps_devices;
DROP TABLE IF EXISTS public.financial_records;
DROP TABLE IF EXISTS public.email_settings;
DROP TABLE IF EXISTS public.email_logs;
DROP TABLE IF EXISTS public.documents;
DROP TABLE IF EXISTS public.checklists;
DROP TABLE IF EXISTS public.broker_emails;
DROP TABLE IF EXISTS public.broker_dispatches;
DROP TABLE IF EXISTS public.audit_logs;
DROP TYPE IF EXISTS public.whatsapp_status;
DROP TYPE IF EXISTS public.whatsapp_provider;
DROP TYPE IF EXISTS public.whatsapp_event;
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: whatsapp_event; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.whatsapp_event AS ENUM (
    'payment_generated',
    'invoice_issued',
    'invoice_overdue',
    'maintenance_due',
    'geofence_alert'
);


--
-- Name: whatsapp_provider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.whatsapp_provider AS ENUM (
    'twilio',
    'meta',
    'mock'
);


--
-- Name: whatsapp_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.whatsapp_status AS ENUM (
    'sent',
    'failed',
    'retrying'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    user_id character varying,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id character varying,
    details jsonb,
    ip_address text,
    "timestamp" timestamp without time zone DEFAULT now()
);


--
-- Name: broker_dispatches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.broker_dispatches (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    dispatch_number text NOT NULL,
    trailer_id character varying NOT NULL,
    broker_name text NOT NULL,
    broker_email text NOT NULL,
    broker_phone text,
    pickup_location text NOT NULL,
    pickup_date date NOT NULL,
    delivery_location text NOT NULL,
    estimated_delivery_date date,
    actual_delivery_date date,
    load_type text NOT NULL,
    special_instructions text,
    dispatch_document_url text,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: broker_emails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.broker_emails (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    trailer_id character varying NOT NULL,
    broker_email text NOT NULL,
    trailer_plate text NOT NULL,
    trailer_type text NOT NULL,
    current_location text NOT NULL,
    destination text NOT NULL,
    estimated_date date,
    email_body text NOT NULL,
    status text DEFAULT 'sent'::text NOT NULL,
    sent_at timestamp without time zone DEFAULT now()
);


--
-- Name: checklists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.checklists (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    trailer_id character varying NOT NULL,
    type text NOT NULL,
    items jsonb NOT NULL,
    approved boolean DEFAULT false NOT NULL,
    rejected boolean DEFAULT false NOT NULL,
    rejection_reason text,
    inspector text NOT NULL,
    approved_by character varying,
    approved_at timestamp without time zone,
    photos jsonb,
    notes text,
    inspection_date timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    user_id character varying,
    share_id character varying,
    document_type text NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    status text DEFAULT 'verified'::text NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now()
);


--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    recipient_email text NOT NULL,
    recipient_name text,
    subject text NOT NULL,
    email_type text NOT NULL,
    entity_type text,
    entity_id character varying,
    status text DEFAULT 'sent'::text NOT NULL,
    error_message text,
    sent_at timestamp without time zone DEFAULT now()
);


--
-- Name: email_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    setting_key text NOT NULL,
    setting_value text NOT NULL,
    description text,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: financial_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_records (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    month character varying(7) NOT NULL,
    total_revenue numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    investor_payouts numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    operational_costs numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    company_margin numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: gps_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gps_devices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    trailer_id character varying NOT NULL,
    device_id text NOT NULL,
    provider text DEFAULT 'generic'::text NOT NULL,
    api_key text,
    status text DEFAULT 'inactive'::text NOT NULL,
    last_ping timestamp without time zone,
    config_data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    invoice_id character varying NOT NULL,
    description text NOT NULL,
    rate numeric(10,2) NOT NULL,
    quantity numeric(10,2) DEFAULT '1'::numeric NOT NULL,
    amount numeric(10,2) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    invoice_number text NOT NULL,
    contract_id character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    due_date date NOT NULL,
    paid_date date,
    status text DEFAULT 'pending'::text NOT NULL,
    reference_month character varying(7) NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text, 'reissued'::text])))
);


--
-- Name: maintenance_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_schedules (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    trailer_id character varying NOT NULL,
    schedule_type text NOT NULL,
    interval_days integer,
    interval_km numeric(10,2),
    last_maintenance_date date,
    last_maintenance_km numeric(10,2),
    next_maintenance_date date,
    next_maintenance_km numeric(10,2),
    status text DEFAULT 'scheduled'::text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    user_id character varying NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    severity text DEFAULT 'info'::text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    trailer_id character varying,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    read_at timestamp without time zone
);


--
-- Name: partner_shops; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_shops (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    zip_code text,
    country text DEFAULT 'US'::text NOT NULL,
    phone text NOT NULL,
    email text,
    specialties jsonb,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    share_id character varying NOT NULL,
    user_id character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_date date NOT NULL,
    status text DEFAULT 'paid'::text NOT NULL,
    reference_month character varying(7) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: rental_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rental_clients (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    company_name text NOT NULL,
    trade_name text,
    tax_id text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    address text,
    city text,
    state text,
    zip_code text,
    country text DEFAULT 'US'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: rental_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rental_contracts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    contract_number text NOT NULL,
    client_id character varying NOT NULL,
    trailer_id character varying NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    monthly_rate numeric(10,2) NOT NULL,
    duration integer NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    auto_generate_invoices boolean DEFAULT true NOT NULL,
    invoice_day_of_month integer DEFAULT 1 NOT NULL,
    payment_due_days integer DEFAULT 15 NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: shares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shares (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    user_id character varying NOT NULL,
    trailer_id character varying NOT NULL,
    purchase_value numeric(10,2) NOT NULL,
    purchase_date date NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    monthly_return numeric(5,2) DEFAULT 2.00 NOT NULL,
    total_returns numeric(10,2) DEFAULT 0.00 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    domain text,
    logo_url text,
    primary_color text DEFAULT '#2563eb'::text,
    secondary_color text DEFAULT '#3b82f6'::text,
    accent_color text DEFAULT '#1d4ed8'::text,
    subscription_plan text DEFAULT 'basic'::text NOT NULL,
    billing_email text,
    max_users integer DEFAULT 10,
    max_trailers integer DEFAULT 50,
    stripe_customer_id text,
    stripe_subscription_id text,
    status text DEFAULT 'active'::text NOT NULL,
    trial_ends_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    pix_key text,
    pix_beneficiary text,
    bank_name text,
    bank_agency text,
    bank_account text,
    bank_account_holder text,
    bank_account_type text
);


--
-- Name: tracking_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tracking_data (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    trailer_id character varying NOT NULL,
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    speed numeric(5,2),
    location text,
    status text DEFAULT 'moving'::text NOT NULL,
    distance_today numeric(10,2),
    "timestamp" timestamp without time zone DEFAULT now()
);


--
-- Name: trailers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trailers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    trailer_id text NOT NULL,
    trailer_type text DEFAULT 'Seco'::text NOT NULL,
    model text DEFAULT 'Dry Van 53ft'::text NOT NULL,
    purchase_value numeric(10,2) NOT NULL,
    purchase_date date NOT NULL,
    status text DEFAULT 'stock'::text NOT NULL,
    current_value numeric(10,2) NOT NULL,
    depreciation_rate numeric(5,2) DEFAULT 0.05 NOT NULL,
    expiration_date date,
    location text,
    latitude numeric(10,7),
    longitude numeric(10,7),
    last_activity timestamp without time zone,
    total_shares integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    first_name text,
    last_name text,
    role text DEFAULT 'investor'::text NOT NULL,
    country text DEFAULT 'US'::text,
    phone text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: whatsapp_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    event public.whatsapp_event NOT NULL,
    recipient_phone text NOT NULL,
    recipient_name text,
    status public.whatsapp_status DEFAULT 'sent'::public.whatsapp_status NOT NULL,
    provider public.whatsapp_provider DEFAULT 'mock'::public.whatsapp_provider NOT NULL,
    message_id text,
    retries integer DEFAULT 0 NOT NULL,
    error text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, details, ip_address, "timestamp") FROM stdin;
2f02b287-9dc8-4dbf-8015-f8b4c3c0b767	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-03-25 13:25:48.207318
af4c2546-12d8-463a-8d2b-bcd0cd4e5692	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-03-25 13:26:01.851462
b3aafdec-5a2b-4d8d-9e18-976c011f36cd	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-03-25 13:26:43.941718
8a07c8b2-d612-41e5-a08c-e00e9fe4a87e	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-03-25 14:00:57.684177
b954030d-40ca-40f6-bba5-e3848816f66f	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-03-30 15:25:35.847016
6e757a67-de77-45f9-baa3-207160b7eb24	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-03-30 19:02:23.148453
417b4162-5316-456a-bc2e-979c4c2d6cb3	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-03-30 19:02:32.453196
05960c71-182b-4245-8b15-5ff10f62803f	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-03-30 19:02:36.269757
4792fece-5f2a-4895-81da-83de25dfe398	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-03-30 19:05:14.958198
eb8d7056-8daa-49ed-a63c-4fde4bd1dfeb	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-03-30 19:11:44.044607
86d5d096-35d1-4f54-a60f-336931584b29	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-03-31 16:53:03.205037
2c4ae29e-5c44-4393-80da-1809bc7b3c10	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-01 19:18:08.355869
00f424b5-bbfe-4a40-a0e7-98fbb4339be3	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-06 17:35:43.373974
32478130-a4d3-4e5c-89a2-d5cac107031d	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-07 14:22:20.705375
461ef3de-63ad-4d58-af4e-e060d21acd42	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-07 14:48:43.996386
56673ed2-4232-406a-9592-261a80ed7f07	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-07 14:48:52.757684
afacc551-d3d0-4829-9b82-c4c8667f27da	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-07 14:52:45.145067
7d0a3e8e-1cbe-4db8-a838-f5017f1b0533	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-07 14:55:26.276848
5ddd8ad9-53f8-4dcc-bdb6-fa8a5808a304	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-07 14:58:00.993738
66909a56-8b19-4dfd-b7d3-6145a4f0d72c	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-09 16:42:51.365763
8b508221-2383-404f-bd33-e85f505dabc3	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-09 17:46:25.927524
96d7497a-eaa8-4242-aae0-fe505ff297f0	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-09 18:36:19.695887
0c53e5c4-c2e3-413a-b197-7fd71fc459f7	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-09 18:36:19.942013
cb243d8e-cf30-47ce-a736-532de88a89a0	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	create_trailer	trailer	84616f55-1d43-4c2e-b964-8c4eb124cbc1	{"vin": "1UYVS2538K6576211", "body": "TL", "make": "UTIL", "year": 2019, "model": "Dry Van 53ft", "status": "stock", "location": "Houston, TX", "titleDate": "2025-11-21", "trailerId": "TRS001", "weightLbs": "15500", "vehicleUse": "PRIVATE", "titleNumber": "161329653", "totalShares": 1, "trailerType": "Seco", "currentValue": "28000.00", "purchaseDate": "2025-04-09", "purchaseValue": "28000.00", "allocationType": "open", "depreciationRate": "0.05"}	127.0.0.1	2026-04-09 18:36:30.171137
c56022cf-b19b-4d29-b103-06bded4e20ba	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-09 18:55:15.874192
6e21077c-b1c9-4555-bf55-0f32c7b4c1e4	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-09 19:27:27.162467
16fdb17e-9dcb-42a6-9b0d-0b9db5fa5ef1	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-10 13:09:05.458722
69fdab88-67c8-4bda-958e-67fb82aafa54	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-10 18:16:45.473474
50c22b64-cbaf-47a3-8bcd-d49a1792c6dd	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-10 18:35:56.626485
726789ca-52a8-41c7-ac57-821c5cf7f268	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-10 18:37:25.872205
8ea742a7-2997-40c2-90f4-3a9b527e9fb3	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-10 18:42:47.404985
d8719caa-8b29-45a4-b75f-ba60038f3224	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	create	rental_client	f62e3d16-2c16-4bc8-97dc-a208bd3c7111	{"taxId": "XX-XTREME-LOGISTICS", "companyName": "XTREME LOGISTICS"}	127.0.0.1	2026-04-10 18:44:00.197924
89a46f10-7151-4c86-b6cd-365b72cfb2c6	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	create	rental_client	2d107576-f5a8-447e-8663-408921e34d19	{"taxId": "XX-JW-EXPRESS-TRUCKING", "companyName": "JW Express Trucking"}	127.0.0.1	2026-04-10 18:44:00.234415
945c8ab0-3cc9-4612-b32a-06c4295e434e	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	create	rental_client	845e069f-dac2-4750-8d2c-14a344d58a70	{"taxId": "XX-TSE-LOGISTICS-INC", "companyName": "TSE LOGISTICS INC"}	127.0.0.1	2026-04-10 18:44:00.265277
ff0fdca6-3aa0-4ac9-b290-39aff785cf09	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	create_trailer	trailer	72885b71-f8df-4313-b3cb-00295188d471	{"body": "Reefer", "make": "Utility", "year": 2016, "model": "Utility Reefer 2016", "status": "active", "trailerId": "TRC001", "vehicleUse": "COMMERCIAL", "totalShares": 1, "trailerType": "Climatizado", "currentValue": "28000", "purchaseDate": "2016-01-01", "purchaseValue": "45000", "depreciationRate": "0.05"}	127.0.0.1	2026-04-10 18:44:26.970724
c6fff1d9-dd46-49a4-853d-2050cbbe83c4	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	create_trailer	trailer	3765e855-9d45-439d-a2fd-bc2950d9ff6f	{"body": "Reefer", "make": "Utility", "year": 2019, "model": "Utility Reefer 2019", "status": "active", "trailerId": "TRC002", "vehicleUse": "COMMERCIAL", "totalShares": 1, "trailerType": "Climatizado", "currentValue": "38000", "purchaseDate": "2019-01-01", "purchaseValue": "52000", "depreciationRate": "0.05"}	127.0.0.1	2026-04-10 18:44:27.022379
c4741457-0538-46e4-ad8a-7ea3442848b2	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	create_trailer	trailer	c2dfedcf-285b-4f2e-92cd-f235a0394864	{"body": "Reefer", "make": "Utility", "year": 2019, "model": "Utility Reefer 2019", "status": "active", "trailerId": "TRC003", "vehicleUse": "COMMERCIAL", "totalShares": 1, "trailerType": "Climatizado", "currentValue": "38000", "purchaseDate": "2019-01-01", "purchaseValue": "52000", "depreciationRate": "0.05"}	127.0.0.1	2026-04-10 18:44:27.07557
fa4f41cd-ccc9-48a5-aa29-5881477e31a4	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	create	rental_contract	49c32019-aa1c-49a6-afb9-d794666fb227	{"notes": "XTREME LOGISTICS - Utility Reefer 2019 - $1,300/month. From INV01421.", "status": "active", "endDate": "2026-12-31", "clientId": "f62e3d16-2c16-4bc8-97dc-a208bd3c7111", "duration": 12, "tenantId": "141682d0-8688-4eab-a1c9-83a208accef4", "startDate": "2026-01-01", "trailerId": "3765e855-9d45-439d-a2fd-bc2950d9ff6f", "monthlyRate": "1300.00", "contractNumber": "RC001", "paymentDueDays": 0, "invoiceDayOfMonth": 18, "autoGenerateInvoices": false}	127.0.0.1	2026-04-10 18:44:54.248414
efe41f58-5fbf-4e4e-82d0-43ad6747ca18	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	create	rental_contract	819735f2-cc7a-4bb3-adc6-d38f5329b431	{"notes": "JW Express Trucking (Wilfred) - Utility Reefer 2016 - $1,400/month + security deposit $1,400. From INV0159.", "status": "active", "endDate": "2026-12-31", "clientId": "2d107576-f5a8-447e-8663-408921e34d19", "duration": 12, "tenantId": "141682d0-8688-4eab-a1c9-83a208accef4", "startDate": "2026-01-01", "trailerId": "72885b71-f8df-4313-b3cb-00295188d471", "monthlyRate": "1400.00", "contractNumber": "RC002", "paymentDueDays": 0, "invoiceDayOfMonth": 10, "autoGenerateInvoices": false}	127.0.0.1	2026-04-10 18:44:54.280251
b2a0ab85-bcf8-4a58-a381-affc2782f2a4	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	create	rental_contract	9ecc3763-6308-4864-9f16-7070e6d88694	{"notes": "TSE LOGISTICS INC - Utility Reefer 2019 - $1,300/month. From INV01491.", "status": "active", "endDate": "2026-12-31", "clientId": "845e069f-dac2-4750-8d2c-14a344d58a70", "duration": 12, "tenantId": "141682d0-8688-4eab-a1c9-83a208accef4", "startDate": "2026-01-01", "trailerId": "c2dfedcf-285b-4f2e-92cd-f235a0394864", "monthlyRate": "1300.00", "contractNumber": "RC003", "paymentDueDays": 0, "invoiceDayOfMonth": 18, "autoGenerateInvoices": false}	127.0.0.1	2026-04-10 18:44:54.315745
ad8f97dc-ba28-44aa-9627-243343b1850c	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	create	invoice	6b152d0d-d2c4-4108-b974-1cf1878b80b0	{"notes": "2019 Utility Reefer MONTHLY RENT - $1,300.00. Billed to: XTREME LOGISTICS (+1 407-283-4961).", "amount": "1300.00", "status": "pending", "dueDate": "2026-03-18", "tenantId": "141682d0-8688-4eab-a1c9-83a208accef4", "contractId": "49c32019-aa1c-49a6-afb9-d794666fb227", "invoiceNumber": "INV01421", "referenceMonth": "2026-03"}	127.0.0.1	2026-04-10 18:45:14.319921
e1bd3b7a-9774-4469-9575-6511f00eeadb	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	create	invoice	519c9567-8bca-4fba-b0f1-b1203d822034	{"notes": "2016 Utility Reefer MONTHLY RENT $1,400.00 + Sales tax $91.00 + Refundable Security Deposit $1,400.00 = $2,891.00 TOTAL. Paid in full via Cash on 02/11/2026. Billed to: JW Express Trucking (Wilfred, +1 689-220-8520).", "amount": "2891.00", "status": "paid", "dueDate": "2026-02-10", "paidDate": "2026-02-11", "tenantId": "141682d0-8688-4eab-a1c9-83a208accef4", "contractId": "819735f2-cc7a-4bb3-adc6-d38f5329b431", "invoiceNumber": "INV0159", "referenceMonth": "2026-02"}	127.0.0.1	2026-04-10 18:45:14.352019
1af81942-6f70-46b3-b617-693c30f67674	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	create	invoice	84050ff2-c075-4d38-8f2a-42f6f31e161a	{"notes": "2019 Utility Reefer MONTHLY RENT - $1,300.00. Billed to: TSE LOGISTICS INC, 745 Arlington Ave, Arlington Heights OH (+1 305-491-8642 / +1 347-574-1404).", "amount": "1300.00", "status": "pending", "dueDate": "2026-03-18", "tenantId": "141682d0-8688-4eab-a1c9-83a208accef4", "contractId": "9ecc3763-6308-4864-9f16-7070e6d88694", "invoiceNumber": "INV01491", "referenceMonth": "2026-03"}	127.0.0.1	2026-04-10 18:45:14.37866
a0883448-2f1f-473b-abf9-da096a7046b0	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-10 18:55:41.518353
716594ed-e3eb-42de-bb09-ca84321f34c2	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-10 18:58:04.540626
9b5922f5-e6f3-47de-8f60-4aff4182caa7	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-10 20:19:38.955158
15f9b411-9a8d-4cf8-af01-91a3d193aa8f	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-11 16:03:23.442295
60ca78c2-e34f-4205-b190-ea141b6d3abf	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	send_payment_reminder	invoice	84050ff2-c075-4d38-8f2a-42f6f31e161a	{"daysOverdue": 24, "invoiceNumber": "INV01491", "recipientEmail": "tsetruck@gmail.com"}	127.0.0.1	2026-04-11 16:11:37.122743
3098f919-fffc-4637-a4f3-6b118a56e0f9	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-11 16:21:27.456684
9679dd61-aaf2-4de7-adde-dd32a6f55657	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-11 16:22:42.074287
f01ec501-887b-4f59-a949-cde86b5f7d0f	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-11 16:35:46.690475
a6795cb8-3e63-4af1-a1c2-21e08b8153c8	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-27 22:29:50.354519
71b5eda1-4447-48ae-915d-410b9439708b	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-27 22:40:21.351981
25ff59d8-fa82-4c87-b896-8c8ad7596fc6	141682d0-8688-4eab-a1c9-83a208accef4	526fae16-5da1-4335-b878-5919afde1cb4	login	user	526fae16-5da1-4335-b878-5919afde1cb4	{"role": "admin", "email": "admin@opuscapital.com"}	127.0.0.1	2026-04-27 23:12:29.738046
\.


--
-- Data for Name: broker_dispatches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.broker_dispatches (id, tenant_id, dispatch_number, trailer_id, broker_name, broker_email, broker_phone, pickup_location, pickup_date, delivery_location, estimated_delivery_date, actual_delivery_date, load_type, special_instructions, dispatch_document_url, status, notes, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: broker_emails; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.broker_emails (id, trailer_id, broker_email, trailer_plate, trailer_type, current_location, destination, estimated_date, email_body, status, sent_at) FROM stdin;
\.


--
-- Data for Name: checklists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.checklists (id, tenant_id, trailer_id, type, items, approved, rejected, rejection_reason, inspector, approved_by, approved_at, photos, notes, inspection_date, created_at) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documents (id, tenant_id, user_id, share_id, document_type, file_name, file_url, status, uploaded_at) FROM stdin;
\.


--
-- Data for Name: email_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_logs (id, tenant_id, recipient_email, recipient_name, subject, email_type, entity_type, entity_id, status, error_message, sent_at) FROM stdin;
\.


--
-- Data for Name: email_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_settings (id, setting_key, setting_value, description, updated_at) FROM stdin;
\.


--
-- Data for Name: financial_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.financial_records (id, tenant_id, month, total_revenue, investor_payouts, operational_costs, company_margin, created_at) FROM stdin;
\.


--
-- Data for Name: gps_devices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gps_devices (id, tenant_id, trailer_id, device_id, provider, api_key, status, last_ping, config_data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoice_items (id, tenant_id, invoice_id, description, rate, quantity, amount, sort_order, created_at) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, tenant_id, invoice_number, contract_id, amount, due_date, paid_date, status, reference_month, notes, created_at) FROM stdin;
6b152d0d-d2c4-4108-b974-1cf1878b80b0	141682d0-8688-4eab-a1c9-83a208accef4	INV01421	49c32019-aa1c-49a6-afb9-d794666fb227	1300.00	2026-03-18	\N	pending	2026-03	2019 Utility Reefer MONTHLY RENT - $1,300.00. Billed to: XTREME LOGISTICS (+1 407-283-4961).	2026-04-10 18:45:14.312105
519c9567-8bca-4fba-b0f1-b1203d822034	141682d0-8688-4eab-a1c9-83a208accef4	INV0159	819735f2-cc7a-4bb3-adc6-d38f5329b431	2891.00	2026-02-10	2026-02-11	paid	2026-02	2016 Utility Reefer MONTHLY RENT $1,400.00 + Sales tax $91.00 + Refundable Security Deposit $1,400.00 = $2,891.00 TOTAL. Paid in full via Cash on 02/11/2026. Billed to: JW Express Trucking (Wilfred, +1 689-220-8520).	2026-04-10 18:45:14.345896
84050ff2-c075-4d38-8f2a-42f6f31e161a	141682d0-8688-4eab-a1c9-83a208accef4	INV01491	9ecc3763-6308-4864-9f16-7070e6d88694	1300.00	2026-03-18	\N	pending	2026-03	2019 Utility Reefer MONTHLY RENT - $1,300.00. Billed to: TSE LOGISTICS INC, 745 Arlington Ave, Arlington Heights OH (+1 305-491-8642 / +1 347-574-1404).	2026-04-10 18:45:14.373811
\.


--
-- Data for Name: maintenance_schedules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenance_schedules (id, tenant_id, trailer_id, schedule_type, interval_days, interval_km, last_maintenance_date, last_maintenance_km, next_maintenance_date, next_maintenance_km, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, tenant_id, user_id, title, message, type, severity, read, trailer_id, metadata, created_at, read_at) FROM stdin;
\.


--
-- Data for Name: partner_shops; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.partner_shops (id, tenant_id, name, address, city, state, zip_code, country, phone, email, specialties, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, tenant_id, share_id, user_id, amount, payment_date, status, reference_month, created_at) FROM stdin;
\.


--
-- Data for Name: rental_clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rental_clients (id, tenant_id, company_name, trade_name, tax_id, email, phone, address, city, state, zip_code, country, status, created_at, updated_at) FROM stdin;
f62e3d16-2c16-4bc8-97dc-a208bd3c7111	141682d0-8688-4eab-a1c9-83a208accef4	XTREME LOGISTICS	\N	XX-XTREME-LOGISTICS	admin@xtremequalitylogistic.com	+14072834961		\N	\N	\N	US	active	2026-04-10 18:44:00.190585	2026-04-10 18:44:00.190585
2d107576-f5a8-447e-8663-408921e34d19	141682d0-8688-4eab-a1c9-83a208accef4	JW Express Trucking	JW Express	XX-JW-EXPRESS-TRUCKING	jwexpress509@gmail.com	+16892208520		\N	\N	\N	US	active	2026-04-10 18:44:00.225753	2026-04-10 18:44:00.225753
845e069f-dac2-4750-8d2c-14a344d58a70	141682d0-8688-4eab-a1c9-83a208accef4	TSE LOGISTICS INC	\N	XX-TSE-LOGISTICS-INC	tsetruck@gmail.com	+13054918642	745 Arlington Ave	Arlington Heights	OH	\N	US	active	2026-04-10 18:44:00.25925	2026-04-10 18:44:00.25925
\.


--
-- Data for Name: rental_contracts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rental_contracts (id, tenant_id, contract_number, client_id, trailer_id, start_date, end_date, monthly_rate, duration, status, auto_generate_invoices, invoice_day_of_month, payment_due_days, notes, created_at, updated_at) FROM stdin;
49c32019-aa1c-49a6-afb9-d794666fb227	141682d0-8688-4eab-a1c9-83a208accef4	RC001	f62e3d16-2c16-4bc8-97dc-a208bd3c7111	3765e855-9d45-439d-a2fd-bc2950d9ff6f	2026-01-01	2026-12-31	1300.00	12	active	f	18	0	XTREME LOGISTICS - Utility Reefer 2019 - $1,300/month. From INV01421.	2026-04-10 18:44:54.210854	2026-04-10 18:44:54.210854
819735f2-cc7a-4bb3-adc6-d38f5329b431	141682d0-8688-4eab-a1c9-83a208accef4	RC002	2d107576-f5a8-447e-8663-408921e34d19	72885b71-f8df-4313-b3cb-00295188d471	2026-01-01	2026-12-31	1400.00	12	active	f	10	0	JW Express Trucking (Wilfred) - Utility Reefer 2016 - $1,400/month + security deposit $1,400. From INV0159.	2026-04-10 18:44:54.275693	2026-04-10 18:44:54.275693
9ecc3763-6308-4864-9f16-7070e6d88694	141682d0-8688-4eab-a1c9-83a208accef4	RC003	845e069f-dac2-4750-8d2c-14a344d58a70	c2dfedcf-285b-4f2e-92cd-f235a0394864	2026-01-01	2026-12-31	1300.00	12	active	f	18	0	TSE LOGISTICS INC - Utility Reefer 2019 - $1,300/month. From INV01491.	2026-04-10 18:44:54.310788	2026-04-10 18:44:54.310788
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (sid, sess, expire) FROM stdin;
2MUUugN0dzClO2m2TqLz6qFTxTAxKBV2	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-04T23:12:29.741Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"526fae16-5da1-4335-b878-5919afde1cb4","tenantId":"141682d0-8688-4eab-a1c9-83a208accef4","user":{"id":"526fae16-5da1-4335-b878-5919afde1cb4","email":"admin@opuscapital.com","role":"admin"}}	2026-05-05 00:11:47
\.


--
-- Data for Name: shares; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shares (id, tenant_id, user_id, trailer_id, purchase_value, purchase_date, status, monthly_return, total_returns, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenants (id, name, slug, domain, logo_url, primary_color, secondary_color, accent_color, subscription_plan, billing_email, max_users, max_trailers, stripe_customer_id, stripe_subscription_id, status, trial_ends_at, created_at, updated_at, pix_key, pix_beneficiary, bank_name, bank_agency, bank_account, bank_account_holder, bank_account_type) FROM stdin;
141682d0-8688-4eab-a1c9-83a208accef4	Opus Capital	opus-rental	\N	\N	#2563eb	#3b82f6	#1d4ed8	enterprise	\N	10	50	\N	\N	active	\N	2026-03-25 13:24:26.976486	2026-03-25 13:24:26.976486	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: tracking_data; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tracking_data (id, tenant_id, trailer_id, latitude, longitude, speed, location, status, distance_today, "timestamp") FROM stdin;
\.


--
-- Data for Name: trailers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trailers (id, tenant_id, trailer_id, trailer_type, model, purchase_value, purchase_date, status, current_value, depreciation_rate, expiration_date, location, latitude, longitude, last_activity, total_shares, created_at, updated_at) FROM stdin;
84616f55-1d43-4c2e-b964-8c4eb124cbc1	141682d0-8688-4eab-a1c9-83a208accef4	TRS001	Seco	Dry Van 53ft	28000.00	2025-04-09	stock	28000.00	0.05	\N	Houston, TX	\N	\N	\N	1	2026-04-09 18:36:30.164116	2026-04-09 18:36:30.164116
72885b71-f8df-4313-b3cb-00295188d471	141682d0-8688-4eab-a1c9-83a208accef4	TRC001	Climatizado	Utility Reefer 2016	45000.00	2016-01-01	active	28000.00	0.05	\N	\N	\N	\N	\N	1	2026-04-10 18:44:26.963026	2026-04-10 18:44:26.963026
3765e855-9d45-439d-a2fd-bc2950d9ff6f	141682d0-8688-4eab-a1c9-83a208accef4	TRC002	Climatizado	Utility Reefer 2019	52000.00	2019-01-01	active	38000.00	0.05	\N	\N	\N	\N	\N	1	2026-04-10 18:44:27.017043	2026-04-10 18:44:27.017043
c2dfedcf-285b-4f2e-92cd-f235a0394864	141682d0-8688-4eab-a1c9-83a208accef4	TRC003	Climatizado	Utility Reefer 2019	52000.00	2019-01-01	active	38000.00	0.05	\N	\N	\N	\N	\N	1	2026-04-10 18:44:27.070029	2026-04-10 18:44:27.070029
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, tenant_id, username, email, password, first_name, last_name, role, country, phone, created_at, updated_at) FROM stdin;
526fae16-5da1-4335-b878-5919afde1cb4	141682d0-8688-4eab-a1c9-83a208accef4	admin	admin@opuscapital.com	$2b$10$AH8uNZYuQU37ymXylf7wU.yDp6lK2uqMmCdof5rG9sHmM11USXnKW	Admin	Opus Capital	admin	US	\N	2026-03-25 13:24:27.043123	2026-03-25 13:24:27.043123
\.


--
-- Data for Name: whatsapp_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.whatsapp_logs (id, tenant_id, event, recipient_phone, recipient_name, status, provider, message_id, retries, error, created_at) FROM stdin;
ac841581-684f-4195-8d78-9a83c7af049a	141682d0-8688-4eab-a1c9-83a208accef4	maintenance_due	+5511999999999	Teste Manual	sent	mock	mock_1775573332824_lrfii0	0	\N	2026-04-07 14:48:52.825861
1e7ef257-e894-4c49-bd7d-2373f29bf855	141682d0-8688-4eab-a1c9-83a208accef4	geofence_alert	+5511999999999	Teste Manual	sent	mock	mock_1775573565213_sd95ti	0	\N	2026-04-07 14:52:45.215085
867342bc-12e0-45e9-b06d-bac50cb83ff5	141682d0-8688-4eab-a1c9-83a208accef4	payment_generated	+5511999999999	Teste Manual	sent	mock	mock_1775573726349_kvgyr7	0	\N	2026-04-07 14:55:26.350996
633d1959-a8e8-4310-a28d-c125bf9f7ca2	141682d0-8688-4eab-a1c9-83a208accef4	invoice_issued	+5511999999999	Teste Manual	sent	mock	mock_1775573881061_29tdc8	0	\N	2026-04-07 14:58:01.063023
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: broker_dispatches broker_dispatches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.broker_dispatches
    ADD CONSTRAINT broker_dispatches_pkey PRIMARY KEY (id);


--
-- Name: broker_emails broker_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.broker_emails
    ADD CONSTRAINT broker_emails_pkey PRIMARY KEY (id);


--
-- Name: checklists checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists
    ADD CONSTRAINT checklists_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: email_settings email_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_settings
    ADD CONSTRAINT email_settings_pkey PRIMARY KEY (id);


--
-- Name: email_settings email_settings_setting_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_settings
    ADD CONSTRAINT email_settings_setting_key_unique UNIQUE (setting_key);


--
-- Name: financial_records financial_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_records
    ADD CONSTRAINT financial_records_pkey PRIMARY KEY (id);


--
-- Name: gps_devices gps_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gps_devices
    ADD CONSTRAINT gps_devices_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: maintenance_schedules maintenance_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_schedules
    ADD CONSTRAINT maintenance_schedules_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: partner_shops partner_shops_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_shops
    ADD CONSTRAINT partner_shops_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: rental_clients rental_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_clients
    ADD CONSTRAINT rental_clients_pkey PRIMARY KEY (id);


--
-- Name: rental_contracts rental_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_contracts
    ADD CONSTRAINT rental_contracts_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: shares shares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_slug_unique UNIQUE (slug);


--
-- Name: tracking_data tracking_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracking_data
    ADD CONSTRAINT tracking_data_pkey PRIMARY KEY (id);


--
-- Name: trailers trailers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trailers
    ADD CONSTRAINT trailers_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_logs whatsapp_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_logs
    ADD CONSTRAINT whatsapp_logs_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: idx_audit_logs_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_tenant ON public.audit_logs USING btree (tenant_id);


--
-- Name: idx_broker_dispatch_pickup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broker_dispatch_pickup ON public.broker_dispatches USING btree (pickup_date);


--
-- Name: idx_broker_dispatch_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broker_dispatch_status ON public.broker_dispatches USING btree (status);


--
-- Name: idx_broker_dispatch_trailer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broker_dispatch_trailer ON public.broker_dispatches USING btree (trailer_id);


--
-- Name: idx_broker_emails_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broker_emails_status ON public.broker_emails USING btree (status);


--
-- Name: idx_broker_emails_trailer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broker_emails_trailer ON public.broker_emails USING btree (trailer_id);


--
-- Name: idx_checklists_approved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checklists_approved ON public.checklists USING btree (approved);


--
-- Name: idx_checklists_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checklists_tenant ON public.checklists USING btree (tenant_id);


--
-- Name: idx_checklists_trailer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checklists_trailer ON public.checklists USING btree (trailer_id);


--
-- Name: idx_checklists_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checklists_type ON public.checklists USING btree (type);


--
-- Name: idx_contracts_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contracts_client ON public.rental_contracts USING btree (client_id);


--
-- Name: idx_contracts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contracts_status ON public.rental_contracts USING btree (status);


--
-- Name: idx_contracts_trailer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contracts_trailer ON public.rental_contracts USING btree (trailer_id);


--
-- Name: idx_documents_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_tenant ON public.documents USING btree (tenant_id);


--
-- Name: idx_documents_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_user ON public.documents USING btree (user_id);


--
-- Name: idx_email_logs_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_entity ON public.email_logs USING btree (entity_type, entity_id);


--
-- Name: idx_email_logs_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_recipient ON public.email_logs USING btree (recipient_email);


--
-- Name: idx_email_logs_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_tenant ON public.email_logs USING btree (tenant_id);


--
-- Name: idx_email_logs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_type ON public.email_logs USING btree (email_type);


--
-- Name: idx_invoice_items_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_items_invoice ON public.invoice_items USING btree (invoice_id);


--
-- Name: idx_invoice_items_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_items_tenant ON public.invoice_items USING btree (tenant_id);


--
-- Name: idx_invoices_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_due_date ON public.invoices USING btree (due_date);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- Name: idx_invoices_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_tenant ON public.invoices USING btree (tenant_id);


--
-- Name: idx_maintenance_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maintenance_status ON public.maintenance_schedules USING btree (status);


--
-- Name: idx_maintenance_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maintenance_tenant ON public.maintenance_schedules USING btree (tenant_id);


--
-- Name: idx_maintenance_trailer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maintenance_trailer ON public.maintenance_schedules USING btree (trailer_id);


--
-- Name: idx_notification_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_created ON public.notifications USING btree (created_at);


--
-- Name: idx_notification_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_read ON public.notifications USING btree (read);


--
-- Name: idx_notification_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_tenant ON public.notifications USING btree (tenant_id);


--
-- Name: idx_notification_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_type ON public.notifications USING btree (type);


--
-- Name: idx_notification_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_user ON public.notifications USING btree (user_id);


--
-- Name: idx_partner_shops_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_shops_tenant ON public.partner_shops USING btree (tenant_id);


--
-- Name: idx_payments_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_tenant ON public.payments USING btree (tenant_id);


--
-- Name: idx_payments_user_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_user_month ON public.payments USING btree (user_id, reference_month);


--
-- Name: idx_shares_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shares_tenant ON public.shares USING btree (tenant_id);


--
-- Name: idx_shares_trailer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shares_trailer ON public.shares USING btree (trailer_id);


--
-- Name: idx_shares_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shares_user ON public.shares USING btree (user_id);


--
-- Name: idx_tracking_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tracking_tenant ON public.tracking_data USING btree (tenant_id);


--
-- Name: idx_tracking_trailer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tracking_trailer ON public.tracking_data USING btree (trailer_id);


--
-- Name: idx_whatsapp_logs_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whatsapp_logs_event ON public.whatsapp_logs USING btree (event);


--
-- Name: idx_whatsapp_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whatsapp_logs_status ON public.whatsapp_logs USING btree (status);


--
-- Name: idx_whatsapp_logs_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whatsapp_logs_tenant ON public.whatsapp_logs USING btree (tenant_id);


--
-- Name: uniq_invoices_contract_month; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_invoices_contract_month ON public.invoices USING btree (contract_id, reference_month);


--
-- Name: uniq_invoices_tenant_invoice_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_invoices_tenant_invoice_number ON public.invoices USING btree (tenant_id, invoice_number);


--
-- Name: uniq_payments_share_month; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_payments_share_month ON public.payments USING btree (share_id, reference_month);


--
-- Name: uniq_tenant_contract_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_tenant_contract_number ON public.rental_contracts USING btree (tenant_id, contract_number);


--
-- Name: uniq_tenant_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_tenant_device_id ON public.gps_devices USING btree (tenant_id, device_id);


--
-- Name: uniq_tenant_dispatch_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_tenant_dispatch_number ON public.broker_dispatches USING btree (tenant_id, dispatch_number);


--
-- Name: uniq_tenant_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_tenant_email ON public.users USING btree (tenant_id, email);


--
-- Name: uniq_tenant_month; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_tenant_month ON public.financial_records USING btree (tenant_id, month);


--
-- Name: uniq_tenant_tax_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_tenant_tax_id ON public.rental_clients USING btree (tenant_id, tax_id);


--
-- Name: uniq_tenant_trailer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_tenant_trailer_id ON public.trailers USING btree (tenant_id, trailer_id);


--
-- Name: uniq_tenant_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_tenant_username ON public.users USING btree (tenant_id, username);


--
-- Name: audit_logs audit_logs_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: audit_logs audit_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: broker_dispatches broker_dispatches_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.broker_dispatches
    ADD CONSTRAINT broker_dispatches_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: broker_dispatches broker_dispatches_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.broker_dispatches
    ADD CONSTRAINT broker_dispatches_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: broker_dispatches broker_dispatches_trailer_id_trailers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.broker_dispatches
    ADD CONSTRAINT broker_dispatches_trailer_id_trailers_id_fk FOREIGN KEY (trailer_id) REFERENCES public.trailers(id);


--
-- Name: broker_emails broker_emails_trailer_id_trailers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.broker_emails
    ADD CONSTRAINT broker_emails_trailer_id_trailers_id_fk FOREIGN KEY (trailer_id) REFERENCES public.trailers(id);


--
-- Name: checklists checklists_approved_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists
    ADD CONSTRAINT checklists_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: checklists checklists_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists
    ADD CONSTRAINT checklists_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: checklists checklists_trailer_id_trailers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists
    ADD CONSTRAINT checklists_trailer_id_trailers_id_fk FOREIGN KEY (trailer_id) REFERENCES public.trailers(id);


--
-- Name: documents documents_share_id_shares_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_share_id_shares_id_fk FOREIGN KEY (share_id) REFERENCES public.shares(id);


--
-- Name: documents documents_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: documents documents_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: email_logs email_logs_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: financial_records financial_records_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_records
    ADD CONSTRAINT financial_records_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: gps_devices gps_devices_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gps_devices
    ADD CONSTRAINT gps_devices_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: gps_devices gps_devices_trailer_id_trailers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gps_devices
    ADD CONSTRAINT gps_devices_trailer_id_trailers_id_fk FOREIGN KEY (trailer_id) REFERENCES public.trailers(id);


--
-- Name: invoice_items invoice_items_invoice_id_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: invoices invoices_contract_id_rental_contracts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_contract_id_rental_contracts_id_fk FOREIGN KEY (contract_id) REFERENCES public.rental_contracts(id);


--
-- Name: invoices invoices_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: maintenance_schedules maintenance_schedules_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_schedules
    ADD CONSTRAINT maintenance_schedules_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: maintenance_schedules maintenance_schedules_trailer_id_trailers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_schedules
    ADD CONSTRAINT maintenance_schedules_trailer_id_trailers_id_fk FOREIGN KEY (trailer_id) REFERENCES public.trailers(id);


--
-- Name: notifications notifications_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: notifications notifications_trailer_id_trailers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_trailer_id_trailers_id_fk FOREIGN KEY (trailer_id) REFERENCES public.trailers(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: partner_shops partner_shops_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_shops
    ADD CONSTRAINT partner_shops_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: payments payments_share_id_shares_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_share_id_shares_id_fk FOREIGN KEY (share_id) REFERENCES public.shares(id);


--
-- Name: payments payments_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: payments payments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: rental_clients rental_clients_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_clients
    ADD CONSTRAINT rental_clients_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: rental_contracts rental_contracts_client_id_rental_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_contracts
    ADD CONSTRAINT rental_contracts_client_id_rental_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.rental_clients(id);


--
-- Name: rental_contracts rental_contracts_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_contracts
    ADD CONSTRAINT rental_contracts_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: rental_contracts rental_contracts_trailer_id_trailers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_contracts
    ADD CONSTRAINT rental_contracts_trailer_id_trailers_id_fk FOREIGN KEY (trailer_id) REFERENCES public.trailers(id);


--
-- Name: shares shares_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: shares shares_trailer_id_trailers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_trailer_id_trailers_id_fk FOREIGN KEY (trailer_id) REFERENCES public.trailers(id);


--
-- Name: shares shares_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: tracking_data tracking_data_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracking_data
    ADD CONSTRAINT tracking_data_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tracking_data tracking_data_trailer_id_trailers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracking_data
    ADD CONSTRAINT tracking_data_trailer_id_trailers_id_fk FOREIGN KEY (trailer_id) REFERENCES public.trailers(id);


--
-- Name: trailers trailers_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trailers
    ADD CONSTRAINT trailers_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: users users_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: whatsapp_logs whatsapp_logs_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_logs
    ADD CONSTRAINT whatsapp_logs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- PostgreSQL database dump complete
--

\unrestrict MFwm5DxXi8dF2G79p0wfyKohtPUOmn8m2jVKMzywgPlQoApfc2JqBTwxe6GJwJm

