drop table products_supplies;
drop table products_recipes_products;
drop table products_recipes;
drop table products;



CREATE TABLE products (
	id serial4 NOT NULL,
	product_name varchar(100) NULL,
	userid varchar(100) NOT NULL,
	profit_percentage varchar(100) NULL,
	price float8 NULL,
	product_cost float8 NULL,
	product_cost_with_tax float8 NULL,
	product_cost_with_markup float8 NULL,
	product_cost_with_markup_tax float8 NULL,
	total_fichas float8 NULL,
	total_extras float8 NULL,
	created_at timestamp NOT NULL DEFAULT now(),
	updated_at timestamp NOT NULL DEFAULT now(),
	CONSTRAINT products_pkey PRIMARY KEY (id)
);


CREATE TABLE products_supplies (
	id serial4 NOT NULL,
	supply_name varchar(100) NULL,
	value float8 NULL DEFAULT 0,
	qt int4 NULL DEFAULT 0,
	qtvalue float8 NULL,
	unit varchar(20) NULL,
	product_id int4 NULL DEFAULT 0,
	supply_identity_id varchar(100) NOT NULL,
	FOREIGN KEY (product_id) REFERENCES products (id)
);


CREATE TABLE products_recipes (
	id serial4 NOT NULL,
	recipe_name varchar(100) NULL,
	myprice float8 NULL DEFAULT 0,
	myprof float8 NULL DEFAULT 0,
	profit float8 NULL,
	total float8 NULL DEFAULT 0,
	totalwithtax float8 NULL DEFAULT 0,
	yieldvalue float8 NULL DEFAULT 0,
	yieldvalueunit float8 NULL DEFAULT 0,
	product_id int4 NOT NULL,
	margemper varchar(50) NULL,
	recipe_identity_id varchar(100) NOT NULL,
	CONSTRAINT products_recipes_pkey PRIMARY KEY (id)
);


CREATE TABLE products_recipes_products (
	id serial4 NOT null primary key,
	recipe_product_name varchar(100) NULL,
	value float8 NULL DEFAULT 0,
	status VARCHAR(20) NULL,
	qt integer not null DEFAULT 0,
	qtValue float8 not NULL DEFAULT 0,
	unit VARCHAR(20) not NULL,
	products_recipes_id int4 not null,
	recipes_products_identity_id varchar(100) NOT NULL,
	FOREIGN KEY (products_recipes_id) REFERENCES products_recipes (id)
);