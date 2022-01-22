create or replace procedure procedure_delete_all(userIdentify varchar(100))
language plpgsql
as $$
declare
TABLE_RECORD RECORD;
begin
-- stored procedure body
	
	FOR TABLE_RECORD IN SELECT * FROM products where userid = userIdentify
        LOOP
            
        	   delete from products_supplies where product_id = TABLE_RECORD.id;
        	   delete from products_recipes where product_id = TABLE_RECORD.id;
           
   		 END LOOP;
     delete from products where userid = userIdentify;        
    return;
end; $$

--CALL public.procedure_delete_all('3DtXXvgec9SBYtgT3whh1fsfaTC3');
