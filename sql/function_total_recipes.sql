
CREATE OR REPLACE FUNCTION total_recipes(productId integer) RETURNS numeric AS
$$
declare
	TABLE_RECORD RECORD;
    total numeric;
    currentResult numeric;
begin
	
	 total = 0.0;
	 currentResult = 0.0;

	 FOR TABLE_RECORD IN SELECT * FROM products_recipes where product_id = productId

        LOOP
            currentResult = ((TABLE_RECORD.total * TABLE_RECORD.quantity) / TABLE_RECORD.yieldvalue);
			total = total + currentResult;
            currentResult = 0.0;
        END LOOP;
	
	
	 
      RETURN ROUND(AVG(total)::numeric,2);   
END;
$$ LANGUAGE plpgsql;

--SELECT total_recipes( 2 );
