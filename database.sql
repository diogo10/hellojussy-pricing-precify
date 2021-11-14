CREATE TABLE products (
	id serial4 NOT NULL,
	product_name varchar(100) NULL,
	userid varchar(100) NOT NULL,
	profit_percentage varchar(100) NULL,
	price float8 NULL,
	created_at timestamp NOT NULL DEFAULT now(),
	updated_at timestamp NOT NULL DEFAULT now(),
	CONSTRAINT products_pkey PRIMARY KEY (id)
);


CREATE TABLE products_recipes (
	id serial4 NOT null primary key,
	recipe_name varchar(100) NULL,
	myPrice float8 NULL DEFAULT 0,
	myProf float8 NULL DEFAULT 0,
	profMargemPer float8 NULL,
	total float8 NULL DEFAULT 0,
	totalWithTax float8 NULL DEFAULT 0,
	yieldValue float8 NULL DEFAULT 0,
	yieldValueUnit float8 NULL DEFAULT 0,
	product_id int4 not null ,
	FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE products_recipes_products (
	id serial4 NOT null primary key,
	recipe_product_name varchar(100) NULL,
	value float8 NULL DEFAULT 0,
	status VARCHAR(20) NULL,
	qt integer not null DEFAULT 0,
	qtValue float8 not NULL DEFAULT 0,
	unit VARCHAR(20) not NULL,
	products_recipes_id int4 not null ,
	FOREIGN KEY (products_recipes_id) REFERENCES products_recipes (id)
);



CREATE TABLE products_supplies (
	id serial4 NOT NULL,
	supply_name varchar(100) NULL,
	value float8 NULL DEFAULT 0,
	qt int4 NULL DEFAULT 0,
	qtvalue float8 NULL,
	unit varchar(20) NULL,
	product_id int4 NULL DEFAULT 0,
	FOREIGN KEY (product_id) REFERENCES products (id)
);