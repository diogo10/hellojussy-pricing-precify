CREATE OR REPLACE FUNCTION total_supply(productId integer) RETURNS numeric AS
$$
declare
	TABLE_RECORD RECORD;
    total numeric;
    currentUnit varchar(10);
    currentResult numeric;
begin
	
	 total = 0.0;
	 currentUnit = 'UNID';
	 currentResult = 0.0;

	 FOR TABLE_RECORD IN SELECT * FROM products_supplies where product_id = productId

        LOOP
            currentUnit = TABLE_RECORD.unit;
           
            currentResult = ((TABLE_RECORD.value * TABLE_RECORD.qtvalue) / TABLE_RECORD.qt);
           
           if currentUnit = 'KG' then
    			currentResult = currentResult / 1000;
  			end if;
           
           
			total = total + currentResult;
            currentResult = 0.0;
        END LOOP;
	
	
	 
      RETURN ROUND(AVG(total)::numeric,2);   
END;
$$ LANGUAGE plpgsql;

--SELECT total_supply( 2 );