const text1 = 'INSERT INTO products_recipes(recipe_name, myprice, myprof, profit,margemper,total, totalwithtax, yieldvalue, yieldvalueunit, product_id, recipe_id)'
  + ' VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id';

const text2 = 'INSERT INTO products_recipes_products' +
  '(recipe_product_name, value, status, qt, qtvalue, unit, products_recipes_id)'
  + ' VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id';



async function queryAddRecipes(pool, parentId, list) {

  const pArray = list.map(async element => {

    var valuesRecipes = [element.name, element.myPrice, element.myProf,
    element.profit, element.profMargemPer,
    element.total, element.totalWithTax, element.yieldValue,
    element.yieldValueUnit, parentId, element.id];

    const recipeId = await executeRecipeQuery(pool, valuesRecipes);

    if (recipeId != null) {
      const products = element.products;
      products.forEach(async item => {

        var valuesProduct = [item.name, item.value, item.status, item.qt,
        item.qtValue, item.unit, recipeId];

        const productAdded = await executeRecipeProductsQuery(pool, valuesProduct);
        console.log("productAdded: " + productAdded);
      });


      return true;
    } else {
      return false;
    }

  });

  const results = await Promise.all(pArray);

  let resultToReturn = results.every(function (e) {
    return e;
  });

  console.log("queryAddRecipes: " + resultToReturn);
  return resultToReturn;
}

async function executeRecipeQuery(pool, values) {
  try {
    const response = await pool.query(text1, values);
    const resultId = response.rows[0].id;
    console.log("add recipe id: " + resultId);
    return resultId;
  } catch (err) {
    console.log(err.stack)
    return null;
  }
}

async function executeRecipeProductsQuery(pool, values) {
  try {
    const response = await pool.query(text2, values);
    const result = response.rows[0].id !== null;
    console.log("add recipe products id: " + result);
    return result;
  } catch (err) {
    console.log(err.stack)
    return false;
  }
}

module.exports = {
  queryAddRecipes
}