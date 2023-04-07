create procedure procedure_delete_all(userIdentify varchar(100))
begin
declare table_id int;
set table_id = 0;

 sloop:LOOP
       		SELECT id into table_id FROM products where userid = userIdentify;
       		
       		  delete from products_supplies where product_id = id;
        	  delete from products_recipes where product_id = id;
           
            ITERATE sloop;
END LOOP;
delete from products where userid = userIdentify;           
end;

--CALL public.procedure_delete_all('3DtXXvgec9SBYtgT3whh1fsfaTC3');
