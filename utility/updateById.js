const updateById = async (Model, id, body) => {
  try {
    // test if id is a valid mongo id parameter
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return {
        status: 400,
        response: null,
        message: `${id} is not a valid Id parameter`
      };
    } else {
      // find the document by id
      const model = await Model.findById(id);
      // test if document was found
      if (!model) {
        return {
          status: 400,
          response: null,
          message: `No item found with id ${_id}`
        };
      } else {
        // change properties if provided
        for (let property in body) {
          // has to test if it is in the non default properties
          if (body.hasOwnProperty(property)) {
            model[property] = body[property];
          }
        }
        await model.save();
        return {
          status: 200,
          response: model,
          message: "Update done and saved in the database"
        };
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = updateById;
