create or replace procedure procedure_recalculate(totalTax numeric, markupPer numeric, 
userIdentify varchar(100))
language plpgsql
as $$
declare
TABLE_RECORD RECORD;
productCost numeric;
productCostWithTax numeric;
productCostWithMarkup numeric;
productCostWithMarkupAndTax numeric;
totalSupplies numeric;
totalRecipes numeric;
begin
-- stored procedure body
	
	 productCost = 0.0;
	 productCostWithTax = 0.0;
	 productCostWithMarkup = 0.0;
	 productCostWithMarkupAndTax = 0.0;
	 totalSupplies = 0.0;
	 totalRecipes = 0.0;
	
	FOR TABLE_RECORD IN SELECT * FROM products where userid = userIdentify

        LOOP
            
               totalSupplies = (SELECT total_supply(TABLE_RECORD.id));
               totalRecipes = (SELECT total_recipes(TABLE_RECORD.id));
               productCost = totalSupplies + totalRecipes;
               productCostWithTax = productCost + ((productCost * totalTax) / 100);
               productCostWithMarkup = productCost + ((productCost * markupPer) / 100);
               productCostWithMarkupAndTax = productCostWithMarkup + ((productCostWithMarkup * totalTax) / 100);
           
           
	           UPDATE products SET product_cost = productCost, product_cost_with_tax = productCostWithTax,
	           product_cost_with_markup  = productCostWithMarkup, 
	           product_cost_with_markup_tax = productCostWithMarkupAndTax,
	           total_fichas = totalRecipes, total_extras = totalSupplies 
	           where id = TABLE_RECORD.id;
	          
	           productCost = 0.0;
		 	   productCostWithTax = 0.0;
		 	   productCostWithMarkup = 0.0;
		 	   productCostWithMarkupAndTax = 0.0;
			   totalSupplies = 0.0;
		 	   totalRecipes = 0.0;
           
   		 END LOOP;
   
    return;
	
end; $$

--CALL public.procedure_recalculate(23,39,'3DtXXvgec9SBYtgT3whh1fsfaTC3');