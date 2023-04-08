create procedure procedure_recalculate(totalTax double, markupPer double, userIdentify varchar(100))
begin
DECLARE productCost double;
DECLARE productCostWithTax double;
DECLARE productCostWithMarkup double;
DECLARE productCostWithMarkupAndTax double;
DECLARE totalSupplies double;
DECLARE totalRecipes double;
DECLARE table_id int;
DECLARE finished int DEFAULT 0;
DECLARE MYCURSOR CURSOR FOR SELECT id FROM products where userid = userIdentify;
DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;

	
	 set productCost = 0.0;
	 set productCostWithTax = 0.0;
	 set productCostWithMarkup = 0.0;
	 set productCostWithMarkupAndTax = 0.0;
	 set totalSupplies = 0.0;
	 set totalRecipes = 0.0;
	 set table_id = 0;

OPEN MYCURSOR;
sloop: LOOP
   FETCH MYCURSOR INTO table_id;
   IF finished = 1 THEN 
      LEAVE sloop;
   END IF;
	
  			   -- LOGIC
   			   set totalSupplies = (SELECT total_supply(table_id));
               set totalRecipes = (SELECT  total_recipes(table_id));
               set productCost = totalSupplies + totalRecipes;
               set productCostWithTax = productCost + ((productCost * totalTax) / 100);
               set productCostWithMarkup = productCost + ((productCost * markupPer) / 100);
               set productCostWithMarkupAndTax = productCostWithMarkup + ((productCostWithMarkup * totalTax) / 100);
  			   
               UPDATE products SET product_cost = productCost, product_cost_with_tax = productCostWithTax,
	           product_cost_with_markup  = productCostWithMarkup, 
	           product_cost_with_markup_tax = productCostWithMarkupAndTax,
	           total_fichas = totalRecipes, total_extras = totalSupplies;
	          
	           set productCost = 0.0;
		 	   set productCostWithTax = 0.0;
		 	   set productCostWithMarkup = 0.0;
		 	   set productCostWithMarkupAndTax = 0.0;
			   set totalSupplies = 0.0;
		 	   set totalRecipes = 0.0;
  

END LOOP sloop;
CLOSE MYCURSOR;
	
end;



--CALL public.procedure_recalculate(23,39,'3DtXXvgec9SBYtgT3whh1fsfaTC3');