-- public.products definition

-- Drop table

-- DROP TABLE public.products;

CREATE TABLE public.products (
	id serial4 NOT NULL,
	product_name varchar(100) NULL,
	userid varchar(100) NOT NULL,
	prof varchar(100) NULL,
	price varchar(100) NULL,
	created_at timestamp NOT NULL DEFAULT now(),
	updated_at timestamp NOT NULL DEFAULT now(),
	CONSTRAINT products_pkey PRIMARY KEY (id)
);


-- public.products_supplies definition

-- Drop table

-- DROP TABLE public.products_supplies;

CREATE TABLE public.products_supplies (
	id serial4 NOT NULL,
	"name" varchar(100) NULL,
	value float8 NULL DEFAULT 0,
	qt int4 NULL DEFAULT 0,
	qtvalue float8 NULL,
	unit varchar(20) NULL,
	product_id int4 NULL DEFAULT 0,
	CONSTRAINT products_supplies_pkey PRIMARY KEY (id)
);


-- public.products_supplies foreign keys

ALTER TABLE public.products_supplies ADD CONSTRAINT fk_products_products_supplies FOREIGN KEY (product_id) REFERENCES public.products(id);