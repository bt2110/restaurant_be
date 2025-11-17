// config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Restaurant Management API',
      version: '1.0.0',
      description: 'API Backend cho hệ thống quản lý nhà hàng',
      contact: {
        name: 'Restaurant Backend',
        url: 'http://localhost:3000'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.restaurant.com',
        description: 'Production server'
      }
    ],
    security: [
      {
        BearerAuth: []
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Token từ /api/auth/login'
        }
      },
      schemas: {
        Branch: {
          type: 'object',
          required: ['branch_name'],
          properties: {
            branch_id: {
              type: 'integer',
              example: 1
            },
            rid: {
              type: 'string',
              example: 'br-1731642355000'
            },
            branch_name: {
              type: 'string',
              example: 'Chi nhánh Hà Nội'
            },
            description: {
              type: 'string',
              example: 'Nhà hàng ở phố Hàng Ngoài'
            },
            is_delete: {
              type: 'boolean',
              default: false
            }
          }
        },
        User: {
          type: 'object',
          required: ['user_name', 'password'],
          properties: {
            user_id: {
              type: 'integer',
              example: 1
            },
            rid: {
              type: 'string',
              example: 'usr-1731642400000'
            },
            user_name: {
              type: 'string',
              example: 'admin_hanoi'
            },
            email: {
              type: 'string',
              example: 'admin@hanoi.com'
            },
            lock_up: {
              type: 'boolean',
              default: false
            }
          }
        },
        Table: {
          type: 'object',
          required: ['table_name', 'branch_id'],
          properties: {
            table_id: {
              type: 'integer',
              example: 1
            },
            rid: {
              type: 'string',
              example: 'tbl-1731642500000'
            },
            table_name: {
              type: 'string',
              example: 'Bàn 1'
            },
            description: {
              type: 'string',
              example: 'Bàn ở phòng chính'
            },
            branch_id: {
              type: 'integer',
              example: 1
            },
            is_delete: {
              type: 'boolean',
              default: false
            }
          }
        },
        MenuCategory: {
          type: 'object',
          required: ['category_name', 'branch_id'],
          properties: {
            category_id: {
              type: 'integer',
              example: 1
            },
            rid: {
              type: 'string',
              example: 'cat-1731642600000'
            },
            category_name: {
              type: 'string',
              example: 'Đồ ăn'
            },
            category_image: {
              type: 'string',
              example: 'https://example.com/food.jpg'
            },
            branch_id: {
              type: 'integer',
              example: 1
            },
            is_delete: {
              type: 'boolean',
              default: false
            }
          }
        },
        MenuItem: {
          type: 'object',
          required: ['item_name', 'category_id', 'branch_id'],
          properties: {
            item_id: {
              type: 'integer',
              example: 1
            },
            rid: {
              type: 'string',
              example: 'itm-1731642700000'
            },
            item_name: {
              type: 'string',
              example: 'Cơm tấm'
            },
            category_id: {
              type: 'integer',
              example: 1
            },
            branch_id: {
              type: 'integer',
              example: 1
            },
            item_description: {
              type: 'string',
              example: 'Cơm tấm sườn nước mắm'
            },
            item_image: {
              type: 'string',
              example: 'https://example.com/com-tam.jpg'
            },
            price: {
              type: 'number',
              format: 'decimal',
              example: 50000
            },
            is_disable: {
              type: 'boolean',
              default: false
            },
            is_delete: {
              type: 'boolean',
              default: false
            }
          }
        },
        Order: {
          type: 'object',
          required: ['table_id'],
          properties: {
            order_id: {
              type: 'integer',
              example: 1
            },
            rid: {
              type: 'string',
              example: 'ord-1731642800000'
            },
            table_id: {
              type: 'integer',
              example: 1
            },
            order_status: {
              type: 'string',
              enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
              example: 'pending'
            },
            order_time: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-16T10:00:00Z'
            },
            order_message: {
              type: 'string',
              example: 'Khách mới vào'
            },
            order_note: {
              type: 'string',
              example: 'Khách yêu cầu không cay'
            }
          }
        },
        OrderItem: {
          type: 'object',
          required: ['order_id', 'item_id', 'quantity'],
          properties: {
            order_item_id: {
              type: 'integer',
              example: 1
            },
            order_id: {
              type: 'integer',
              example: 1
            },
            item_id: {
              type: 'integer',
              example: 1
            },
            quantity: {
              type: 'integer',
              example: 2
            },
            note: {
              type: 'string',
              example: 'Ít ớt'
            },
            price: {
              type: 'number',
              format: 'decimal',
              example: 50000
            }
          }
        },
        Notification: {
          type: 'object',
          required: ['branch_id'],
          properties: {
            notification_id: {
              type: 'integer',
              example: 1
            },
            rid: {
              type: 'string',
              example: 'notif-1731642900000'
            },
            order_id: {
              type: 'integer',
              example: 1
            },
            branch_id: {
              type: 'integer',
              example: 1
            },
            sent_time: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-16T10:00:00Z'
            },
            status_admin: {
              type: 'integer',
              enum: [0, 1],
              example: 0,
              description: '0: chưa đọc, 1: đã đọc'
            },
            status_client: {
              type: 'integer',
              enum: [0, 1],
              example: 0
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Thành công'
            },
            data: {
              type: 'object'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Lỗi'
            },
            statusCode: {
              type: 'integer',
              example: 400
            }
          }
        }
      },
      responses: {
        Success: {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuccessResponse'
              }
            }
          }
        },
        BadRequest: {
          description: 'Bad Request - Missing or invalid parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        Conflict: {
          description: 'Conflict - Duplicate data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },
  apis: [
    './routes/authRoutes.js',
    './routes/roleRoutes.js',
    './routes/branchRoutes.js',
    './routes/userRoutes.js',
    './routes/tableRoutes.js',
    './routes/menuRoutes.js',
    './routes/orderRoutes.js',
    './routes/notificationRoutes.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
