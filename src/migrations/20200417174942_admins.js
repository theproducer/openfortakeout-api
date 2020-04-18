exports.up = function (knex) {
    return knex.schema.createTable('admins', (table) => {
        table.increments();
        table.string('email').notNullable();
        table.string('fbuid').notNullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('admins');
};
