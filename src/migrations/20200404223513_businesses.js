exports.up = function (knex) {
    return knex.schema.createTable('businesses', (table) => {
        table.increments();
        table.string('name').notNullable();
        table.string('type').notNullable();
        table.specificType('tags', 'text[]').nullable();
        table.string('phone').notNullable();
        table.string('email').notNullable();
        table.text('details').nullable();
        table.string('hours').nullable();
        table.string('url').nullable();
        table.string('address').notNullable();
        table.string('address2').nullable();
        table.string('city').notNullable();
        table.string('state').notNullable();
        table.string('zipcode').notNullable();
        table.specificType('location', 'GEOGRAPHY(POINT, 4326)').nullable().index('businesses_gix', 'GIST');
        table.string('donateurl').nullable();
        table.boolean('giftcard');
        table.boolean('takeout');
        table.boolean('delivery');
        table.boolean('closed');
        table.boolean('active');
        table.timestamp('created_at', { useTz: false }).notNullable();
        table.timestamp('updated_at', { useTz: false }).notNullable();
        table.timestamp('deleted_at', { useTz: false }).nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('businesses');
};
