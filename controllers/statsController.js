const mongoose = require('mongoose');
const Book = mongoose.models.Book || require('../models/book');

exports.booksByCategory = async (req, res, next) => 
{
  try 
  {
    const agg = await Book.aggregate([
      {
        $project: {
          catArr: {
            $cond: [
              { $gt: [ { $size: { $ifNull: ['$tags', []] } }, 0 ] },
              '$tags',
              {
                $cond: [
                  { $ifNull: ['$category', false] },
                  [ '$category' ],
                  []
                ]
              }
            ]
          }
        }
      },
      { $unwind: '$catArr' },
      { $group: { _id: '$catArr', count: { $sum: 1 } } },
      { $project: { _id: 0, category: '$_id', count: 1 } },
      { $sort: { count: -1, category: 1 } }
    ]);

    res.json(agg);
  } catch (e) { next(e); }
};
