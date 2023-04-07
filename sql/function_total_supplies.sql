CREATE FUNCTION total_supply(productId int) RETURNS DOUBLE
BEGIN
	
declare total DOUBLE;
declare currentUnit varchar(10);
declare currentResult DOUBLE;

SET total = 0.0;
SET currentUnit = 'UNID';
SET currentResult = 0.0;


 sloop:LOOP
       		SELECT unit, ((value * qtvalue) / qt) into currentUnit, currentResult  FROM products_supplies where product_id = productId;
       		
       		if currentUnit = 'KG' then
    			set currentResult = currentResult / 1000;
  			end if;
           
           
			set total = total + currentResult;
            set currentResult = 0.0;
           
            ITERATE sloop;
END LOOP;

      RETURN ROUND(AVG(total),2);    
END;
