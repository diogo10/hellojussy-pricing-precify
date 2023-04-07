CREATE FUNCTION total_recipes(productId INT) RETURNS double
BEGIN
    declare totalResult double;
    SET totalResult = (SELECT SUM(ROUND(((total * quantity) / yieldvalue),2)) AS MYRESULT FROM products_recipes where product_id = productId);
	RETURN totalResult; 
END;

--SELECT total_recipes( 5 );