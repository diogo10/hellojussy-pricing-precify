const recipeDelete = require('./recipes-delete');
const recipeAdd = require('./recipes-add');

async function recalRecipe(pool, recipeBody ,userId, recipeList) {
    
    const pArray = recipeList.map(async element => {
        var productId = element.product_id;
        var quantity = element.quantity;
        recipeBody.quantity = quantity;
        var id = element.id;

        var hasDeleted = await recipeDelete.queryDeleteRecipeById(pool, id, userId);
        console.log("recalRecipe: " + hasDeleted);
        var hasIncluded = await recipeAdd.queryAddRecipes(pool, productId, [recipeBody]);
        console.log("hasIncluded: " + hasIncluded);

        return hasDeleted && hasIncluded;
      });
    
      const results = await Promise.all(pArray);
      let resultToReturn = results.every(function (e) {
        return e;
      });

    return resultToReturn;
}

module.exports = {
    recalRecipe
}