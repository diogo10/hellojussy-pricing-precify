CREATE FUNCTION total_recipes(productId INT) RETURNS double
BEGIN
    declare total double;
    declare currentResult double;
   
    declare table_total double;
    declare table_quantity double;
    declare table_yieldvalue double;
   
    SET total = 0.0;
    SET currentResult = 0.0;
  	SET table_total = 0.0;
 	SET table_quantity = 0.0;
	SET table_yieldvalue = 0.0;
   
   
    sloop:LOOP
        SELECT total,quantity,yieldvalue into table_total, table_quantity, table_yieldvalue  FROM products_recipes where product_id = productId;
       		SET currentResult = ((total * table_quantity) / table_yieldvalue);
			SET total = total + currentResult;
            SET currentResult = 0.0;
            ITERATE sloop;
		END LOOP;

	RETURN ROUND(AVG(total),2);   
END;

--SELECT total_recipes( 2 );