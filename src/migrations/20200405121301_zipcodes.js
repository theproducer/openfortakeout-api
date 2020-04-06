exports.up = function (knex) {
    return knex.schema.createTable('zipcodes', (table) => {
        table.increments();
        table.string('zipcode').notNullable().index('zipcodes_zipcode_idx');
        table.float('lat').notNullable();
        table.float('lng').notNullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('zipcodes');
};
