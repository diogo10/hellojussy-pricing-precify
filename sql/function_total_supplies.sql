CREATE FUNCTION total_supply(productId int) RETURNS DOUBLE
BEGIN
	
DECLARE total DOUBLE;
DECLARE currentResult DOUBLE;

DECLARE finished INTEGER DEFAULT 0;
DECLARE MYCURSOR CURSOR FOR select
    case when unit = 'KG' then ((value * qtvalue) / qt) / 1000
    else ((value * qtvalue) / qt) END AS total
    FROM products_supplies where product_id = productId;
DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;


SET total = 0.0;
SET currentResult = 0.0;

OPEN MYCURSOR;
sloop: LOOP
   FETCH MYCURSOR INTO total;
   IF finished = 1 THEN 
      LEAVE sloop;
   END IF;
	
 set currentResult = total + currentResult;

END LOOP sloop;
CLOSE MYCURSOR;

	RETURN currentResult;    
END;


--SELECT total_supply( 8 );