import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import e from 'express';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('This customer not already exists');
    }

    const productsIds = products.map(product => ({ id: product.id }));

    const existentProduct = await this.productsRepository.findAllById(
      productsIds,
    );

    if (!existentProduct.length) {
      throw new AppError('Could not find any products with the given id');
    }

    const existentProductsIds = existentProduct.map(product => product.id);

    const checkInexistentProducts = products.filter(
      product => !existentProductsIds.includes(product.id),
    );

    if (checkInexistentProducts.length) {
      throw new AppError(
        `Could not find product ${checkInexistentProducts[0].id}`,
      );
    }

    const findProductsWithNoQuantityAvilable = products.filter(
      product =>
        existentProduct.filter(p => p.id === product.id)[0].quantity <=
        product.quantity,
    );

    if (findProductsWithNoQuantityAvilable.length) {
      throw new AppError(
        `The quantity ${findProductsWithNoQuantityAvilable[0].quantity} is not available for ${findProductsWithNoQuantityAvilable[0].id}`,
      );
    }

    const serializedProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: existentProduct.filter(p => p.id === product.id)[0].price,
    }));

    const order = this.ordersRepository.create({
      customer,
      products: serializedProducts,
    });

    const orderProductsQuantity = products.map(product => ({
      id: product.id,
      quantity:
        existentProduct.filter(p => p.id === product.id)[0].quantity -
        product.quantity,
    }));

    await this.productsRepository.updateQuantity(orderProductsQuantity);

    return order;
  }
}

export default CreateOrderService;
