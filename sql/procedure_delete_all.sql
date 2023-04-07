create procedure procedure_delete_all(userIdentify varchar(100))
begin
DECLARE table_id int;
DECLARE finished INTEGER DEFAULT 0;
DECLARE MYCURSOR CURSOR FOR SELECT id FROM products where userid = userIdentify;
DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;

set table_id = 0;

OPEN MYCURSOR;
sloop: LOOP
   FETCH MYCURSOR INTO table_id;
   IF finished = 1 THEN 
      LEAVE sloop;
   END IF;
	
  delete from products_supplies where product_id = table_id;
  delete from products_recipes where product_id = table_id;

END LOOP sloop;
CLOSE MYCURSOR;


 	delete from products where userid = userIdentify;           
end;

--CALL public.procedure_delete_all('3DtXXvgec9SBYtgT3whh1fsfaTC3');
