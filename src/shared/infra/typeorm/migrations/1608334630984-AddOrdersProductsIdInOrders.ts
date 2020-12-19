import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export default class AddOrdersProductsIdInOrders1608334630984
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'order_products_id',
        type: 'uuid',
      }),
    );
    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        name: 'OrdersProductsIdOrders',
        referencedTableName: 'orders_products',
        referencedColumnNames: ['id'],
        columnNames: ['order_products_id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('orders', 'OrdersProductsIdOrders');
    await queryRunner.dropColumn('orders', 'order_products_id');
  }
}
